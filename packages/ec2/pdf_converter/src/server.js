import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { PDFDocument } from "pdf-lib";
import BwipJs from "bwip-js";
import gm from "gm";
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
} from "./utils/constants.js";

import {
  splitPdfAndConvertToTiff,
  multipageMerge,
  cleanUp,
  readFile,
  cleanUpAllTiff,
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

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: params.barCodeText + ".pdf",
    });

    const response = await s3Client.send(getCommand);
    const pdfBytes = await response.Body.transformToByteArray();

    const inputPdfBytes = Buffer.from(pdfBytes);
    const barCodeText = params.barCodeText;

    cleanUpAllTiff();

    const pdfDoc = await PDFDocument.load(inputPdfBytes);

    const numberOfPages = pdfDoc.getPages().length;

    await splitPdfAndConvertToTiff(
      pdfDoc,
      numberOfPages,
      barCodeText,
      params?.barcode_position
    ).then(async () => {
      await multipageMerge(numberOfPages);
      setTimeout(async () => {
        let outputMultiPageTiff = readFile("./multipage.tiff");

        const putCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: params.barCodeText + ".tiff",
          Body: outputMultiPageTiff,
          ACL: "public-read",
        });

        const resp = await s3Client.send(putCommand).catch((err) => {
          console.error("Error uploading to S3: ", err);
          return "err";
        });

        if (resp === "err") {
          throw new Error("Error uploading to S3");
        }

        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: params.barCodeText + ".tiff",
        });

        const tiffUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        }).catch((err) => {
          console.error(
            `Error generating s3 presigned url for file :: ${
              params.barCodeText + ".tiff"
            } :: ${err}`
          );
        });

        return res.json({
          tiff_url: tiffUrl,
        });
      }, 100);
    });
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
