import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { PDFDocument } from "pdf-lib";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import cors from "cors";
import { getXBarcodeCoordinate } from "./utils/utils.js";
import {
  BARCODEYCOORDINATEADJUSTMENT,
  ADDITIONALPAGEHEIGHT,
  RANDOMNUMBERMULTIPLIER,
  EXPORT_TYPES,
} from "./utils/constants.js";

import {
  splitPdfAndConvertToTiff,
  multipageMerge,
  addBarCodeToPdf,
  readFile,
  uploadToS3,
  cleanUpAllTiff,
  getPresignedUrl,
  grayscaleAndCompressPdf,
} from "./utils/utils.js";

const app = express();

app.use(express.json({ limit: "900mb" }));
app.use(cors());

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_REGION,
});

app.get("/signedURL", async (req, res) => {
  const barcode = Math.floor(Math.random() * RANDOMNUMBERMULTIPLIER);
  const objectKey = barcode + ".pdf";

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: objectKey,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }).catch((err) => {
      console.error(
        `Error generating s3 presigned url for file :: ${objectKey} :: ${err}`
      );
    });

    res.json({
      upload_url: uploadUrl,
      object_key: barcode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.post("/barcode", async (req, res) => {
  try {
    const body = req?.body;
    const params = body?.params;

    if (!params || !params.barCodeText) {
      return res.status(400).json({
        statusCode: 400,
        message: "Bad Request",
      });
    }

    const exportType = params?.export_type || "TIFF";

    if (!EXPORT_TYPES.includes(exportType)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Bad Request",
      });
    }

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: params.barCodeText + ".pdf",
    });

    const response = await s3Client.send(getCommand);
    const pdfBytes = await response.Body.transformToByteArray();

    const inputPdfBytes = Buffer.from(pdfBytes);
    const barCodeText = params.barCodeText;
    const position = params?.barcode_position;

    cleanUpAllTiff();

    const pdfDoc = await PDFDocument.load(inputPdfBytes);

    const numberOfPages = pdfDoc.getPages().length;
    if (exportType === "PDF") {
      const compressedPdf = await grayscaleAndCompressPdf(inputPdfBytes, "pdf");
      const updatedPdf = await addBarCodeToPdf(
        compressedPdf.buffer,
        barCodeText,
        position
      );

      const fileKey = params.barCodeText + "-modified.pdf";

      await uploadToS3(s3Client, updatedPdf, fileKey);

      const url = await getPresignedUrl(s3Client, fileKey);

      return res.json({
        url,
        tiff_url: url,
      });
    } else {
      await splitPdfAndConvertToTiff(
        pdfDoc,
        numberOfPages,
        barCodeText,
        position
      );

      const outputPath = multipageMerge(numberOfPages);
      let outputMultiPageTiff = readFile(outputPath);

      // const compressedTiff = await compressTiff(outputMultiPageTiff);

      const fileKey = params.barCodeText + ".tiff";

      await uploadToS3(s3Client, outputMultiPageTiff, fileKey);

      const url = await getPresignedUrl(s3Client, fileKey);

      return res.json({
        url,
        tiff_url: url,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
});

app.listen(8080, () => {
  console.log("server listening on port 8080");
});

export default app;
