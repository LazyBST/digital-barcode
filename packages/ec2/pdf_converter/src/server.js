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
import {
  EXPORT_TYPES,
  BARCODE_GENERATION_RETRY,
  BARCODE_MIN_NUMBER,
  BARCODE_MAX_NUMBER,
  BARCODE_PREFIX,
} from "./utils/constants.js";

import {
  splitPdfAndAddBarCode,
  multipageMerge,
  readFile,
  uploadToS3,
  cleanUpAllFiles,
  getPresignedUrl,
  mergePdfs,
  checkIfBarCodeAlreadyExists,
  pushDataInDb,
  getRandomNumberInclusive,
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
  const query = req.query;
  let barcode = "";
  const tableName = query.tableName;
  const prefix = query.prefix;
  let digitsAppendedBarcode = "";
  try {
    if (tableName && prefix) {
      for (let i = 0; i < BARCODE_GENERATION_RETRY; i++) {
        barcode = getRandomNumberInclusive(
          BARCODE_MIN_NUMBER,
          BARCODE_MAX_NUMBER
        );
        digitsAppendedBarcode = BARCODE_PREFIX + barcode;

        const isExits = await checkIfBarCodeAlreadyExists(
          tableName,
          digitsAppendedBarcode,
          prefix
        );

        if (!isExits) {
          break;
        } else {
          digitsAppendedBarcode = BARCODE_PREFIX;
        }
      }
    } else {
      barcode = getRandomNumberInclusive(
        BARCODE_MIN_NUMBER,
        BARCODE_MAX_NUMBER
      );
      digitsAppendedBarcode = BARCODE_PREFIX + barcode;
    }

    if (digitsAppendedBarcode === BARCODE_PREFIX)
      throw new Error("can't generate unique barcode");

    const objectKey =
      (prefix || "") + digitsAppendedBarcode + "-original" + ".pdf";

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: objectKey,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }).catch((err) => {
      console.error(
        `Error generating s3 presigned url for file :: ${objectKey} :: ${err}`
      );
    });

    if (tableName && prefix) {
      await pushDataInDb(tableName, digitsAppendedBarcode, prefix);
    }

    res.json({
      upload_url: uploadUrl,
      object_key: digitsAppendedBarcode,
      prefix,
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

    const barCodeText = params.barCodeText;
    console.log("generating response for barCode: " + barCodeText);
    const fileName = (params?.prefix || "") + barCodeText;

    const exportType = params?.export_type || "PDF";

    if (!EXPORT_TYPES.includes(exportType)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Bad Request",
      });
    }

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileName + "-original.pdf",
    });

    const response = await s3Client.send(getCommand);
    const pdfBytes = await response.Body.transformToByteArray();

    const inputPdfBytes = Buffer.from(pdfBytes);
    const position = params?.barcode_position;

    const pdfDoc = await PDFDocument.load(inputPdfBytes);

    const numberOfPages = pdfDoc.getPages().length;
    if (exportType === "PDF") {
      await splitPdfAndAddBarCode(
        pdfDoc,
        numberOfPages,
        barCodeText,
        position,
        "pdf"
      );
      const outputPath = await mergePdfs(numberOfPages, barCodeText);
      const outputMultiPagePdf = readFile(outputPath);

      const fileKey = fileName + ".pdf";

      await uploadToS3(s3Client, outputMultiPagePdf, fileKey);

      const url = await getPresignedUrl(s3Client, fileKey);
      cleanUpAllFiles(barCodeText, "pdf");

      return res.json({
        url,
        tiff_url: url,
      });
    } else {
      await splitPdfAndAddBarCode(
        pdfDoc,
        numberOfPages,
        barCodeText,
        position,
        "tiff"
      );

      const outputPath = multipageMerge(numberOfPages, barCodeText);
      let outputMultiPageTiff = readFile(outputPath);

      // const compressedTiff = await compressTiff(outputMultiPageTiff);

      const fileKey = fileName + ".tiff";

      await uploadToS3(s3Client, outputMultiPageTiff, fileKey);

      const url = await getPresignedUrl(s3Client, fileKey);

      cleanUpAllFiles(barCodeText, "tiff");
      return res.json({
        url,
        tiff_url: url,
      });
    }
  } catch (err) {
    console.error({ err });
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
