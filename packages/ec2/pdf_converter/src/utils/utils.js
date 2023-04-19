import * as fs from "fs";
import { PDFDocument } from "pdf-lib";
import BwipJs from "bwip-js";
import gm from "gm";
import mp from "tiff-multipage";
import {
  BARCODEYCOORDINATEADJUSTMENT,
  ADDITIONALPAGEHEIGHT,
} from "./constants.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PDFMerger from "pdf-merger-js";
import {
  DynamoDBClient,
  BatchExecuteStatementCommand,
  QueryCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

let dynamoClient;

export const getXBarcodeCoordinate = (pageWidth, position) => {
  let xCoordinate;
  switch (position) {
    default:
    case "LEFT": {
      xCoordinate = 100;
      break;
    }
    case "MIDDLE": {
      xCoordinate = pageWidth / 2 - 50;
      break;
    }
    case "RIGHT": {
      xCoordinate = pageWidth - 200;
      break;
    }
  }
  return xCoordinate;
};

export async function splitPdfAndAddBarCode(
  pdfDoc,
  numberOfPages,
  barcode,
  position,
  fileType
) {
  const pagesPromises = [];
  for (let i = 0; i < numberOfPages; i++) {
    const subDocument = await PDFDocument.create();
    const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
    subDocument.addPage(copiedPage);
    let pdfBytes = await subDocument.save();
    if (i == 0) {
      pdfBytes = await addBarCodeToPdf(pdfBytes, barcode, position);
    }
    if (fileType === "tiff") {
      pagesPromises.push(
        convertToTiff(Buffer.from(pdfBytes), `output-${i + 1}.${fileType}`)
      );
    } else {
      pagesPromises.push(
        grayscaleAndCompressPdf(
          Buffer.from(pdfBytes),
          `output-${i + 1}.${fileType}`
        )
      );
    }
  }

  const res = await Promise.all(pagesPromises);
  return res;
}

export const addBarCodeToPdf = async (pdfByteStream, barCodeText, position) => {
  const pdfDoc = await PDFDocument.load(pdfByteStream);

  const barCodeBuffer = await BwipJs.toBuffer({
    bcid: "interleaved2of5",
    text: barCodeText,
    scale: 3,
    height: 6,
    backgroundcolor: "ffffff",
    includetext: true,
    textxalign: "center",
    textsize: 13,
    textcolor: "black",
    textfont: "sans-serif",
  })
    .then((pngBuffer) => {
      return pngBuffer;
    })
    .catch((err) => {
      console.error(
        "There was an error generating barcode :: ",
        JSON.stringify(err)
      );
      throw err;
    });

  const barCodePngImage = await pdfDoc.embedPng(barCodeBuffer);

  const pngDims = barCodePngImage.scale(0.35);

  const page = pdfDoc.getPage(0);
  page.setHeight(page.getHeight() + ADDITIONALPAGEHEIGHT);

  page.drawImage(barCodePngImage, {
    x: getXBarcodeCoordinate(page.getWidth(), position),
    y: page.getHeight() + pngDims.height / 2 + BARCODEYCOORDINATEADJUSTMENT,
    width: pngDims.width,
    height: pngDims.height,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

export const convertToTiff = (pdfBuffer, filename) => {
  return new Promise((resolve, reject) => {
    gm.subClass({ imageMagick: true })(pdfBuffer)
      .setFormat("tiff")
      .background("white")
      .density(200, 200)
      .type("grayscale")
      .compress("JPEG")
      .flatten()
      .write(filename, function (error) {
        if (error) {
          console.error("Error saving file", error);
          reject(error);
        } else {
          resolve({ status: "success" });
        }
      });
  });
};

export const multipageMerge = (numberOfPages) => {
  let output_path = "./multipage.tiff";

  let input_paths = [];

  for (let i = 0; i < numberOfPages; i++) {
    if (fs.existsSync(`./output-${i + 1}.tiff`)) {
      input_paths.push(`./output-${i + 1}.tiff`);
    } else {
      console.error("Couldn't find output file ", `output-${i + 1}.tiff`);
    }
  }

  // Async version
  mp.JoinSync(output_path, input_paths);

  return output_path;
};

export const readFile = (path) => {
  if (fs.existsSync(path)) {
    const byteStream = fs.readFileSync(path, null);
    return byteStream;
  }
  throw new Error("Internal Server Error");
};

export const cleanUp = (numberOfPages) => {
  try {
    for (let i = 0; i < numberOfPages; i++) {
      if (fs.existsSync(`./output-${i + 1}.tiff`)) {
        fs.unlinkSync(`./output-${i + 1}.tiff`);
      } else {
        console.error("File not found ", `output-${i + 1}.tiff`);
      }
    }
    if (fs.existsSync("./multipage.tiff")) {
      fs.unlinkSync("./multipage.tiff");
    } else {
      console.error("File not found multipage.tiff");
    }
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

export const cleanUpAllFiles = () => {
  const path = "./";
  let regex = /[.](tiff|pdf)$/;
  fs.readdirSync(path)
    .filter((f) => regex.test(f))
    .map((f) => fs.unlinkSync(path + f));
};

export const compressTiff = (tiffBytes) => {
  return new Promise((resolve, reject) => {
    gm.subClass({ imageMagick: true })(tiffBytes)
      .compress("JPEG")
      .toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
  });
};

export const uploadToS3 = async (s3Client, body, key) => {
  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: body,
    ACL: "public-read",
  });

  const resp = await s3Client.send(putCommand).catch((err) => {
    console.error("Error uploading to S3: ", err);
    return "err";
  });

  if (resp === "err") {
    throw new Error("Error uploading to S3");
  }
};

export const getPresignedUrl = async (s3Client, key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  const tiffUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  }).catch((err) => {
    console.error(
      `Error generating s3 presigned url for file :: ${key} :: ${err}`
    );
  });

  return tiffUrl;
};

export const grayscaleAndCompressPdf = async (pdfBuffer, filename) => {
  return new Promise((resolve, reject) => {
    gm.subClass({ imageMagick: true })(pdfBuffer)
      .setFormat("pdf")
      .background("white")
      .density(200, 200)
      .type("grayscale")
      .compress("JPEG")
      .flatten()
      .write(filename, function (error) {
        if (error) {
          console.error("Error saving file", error);
          reject(error);
        } else {
          resolve({ status: "success" });
        }
      });
  });
};

export const mergePdfs = async (numberOfPages) => {
  const merger = new PDFMerger();

  let output_path = "./multipage.pdf";

  for (let i = 0; i < numberOfPages; i++) {
    if (fs.existsSync(`./output-${i + 1}.pdf`)) {
      await merger.add(`./output-${i + 1}.pdf`);
    } else {
      console.error("Couldn't find output file ", `output-${i + 1}.pdf`);
    }
  }

  await merger.save("./multipage.pdf");

  return output_path;
};

export const getFileNameFromBarcode = (prefix, barcode, extension) => {
  return prefix + barcode + "." + extension;
};

export const extractBarcodeFromFileName = (fileName) => {
  const regexString = /(?<=0).*$/;
  return fileName.match(regexString)?.[0];
};

export const getDynamoClient = () => {
  if (!dynamoClient) {
    dynamoClient = new DynamoDBClient({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      region: process.env.S3_REGION,
    });
  }

  return dynamoClient;
};

export const pushDataInDb = async (tableName, barcode, prefix) => {
  const docClient = getDynamoClient({ apiVersion: "2012-08-10" });
  const item = {
    property_id: {
      S: prefix,
    },
    barcode_number: {
      S: String(barcode),
    },
    created_at: {
      S: new Date().toISOString(),
    },
  };

  const params = new PutItemCommand({
    TableName: tableName,
    Item: item,
    ReturnConsumedCapacity: "TOTAL",
  });

  const response = await docClient.send(params);

  return response;
};

export const checkIfBarCodeAlreadyExists = async (
  tableName,
  barcode,
  prefix
) => {
  const expressionAttributeValues = {
    ":barcode": { S: String(barcode) },
    ":prefix": { S: prefix },
  };

  const keyConditionExpression =
    "property_id = :prefix and barcode_number = :barcode";

  const params = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  });
  const docClient = getDynamoClient();

  const data = await docClient.send(params);

  const { Items } = data;

  let isExist = false;
  for (let item of Items) {
    if (item?.barcode_number?.S === barcode && item?.prefix?.S === prefix) {
      isExist = true;
      break;
    }
  }

  return isExist;
};
