import * as fs from "fs";
import * as util from "util";
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

export async function splitPdfAndConvertToTiff(
  pdfDoc,
  numberOfPages,
  barcode,
  position
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
    pagesPromises.push(
      convertToTiff(Buffer.from(pdfBytes), `output-${i + 1}.tiff`)
    );
  }

  const res = await Promise.all(pagesPromises);
  return res;
}

export const addBarCodeToPdf = async (pdfByteStream, barCodeText, position) => {
  const pdfDoc = await PDFDocument.load(pdfByteStream);

  const barCodeBuffer = await BwipJs.toBuffer({
    bcid: "code2of5",
    text: barCodeText,
    scale: 3,
    height: 5,
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

export const cleanUpAllTiff = () => {
  const path = "./";
  let regex = /[.]tiff$/;
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

export const grayscaleAndCompressPdf = async (pdfBuffer, outputFormat) => {
  return new Promise((resolve, reject) => {
    gm.subClass({ imageMagick: true })(pdfBuffer)
      .setFormat(outputFormat)
      .background("white")
      .density(200, 200)
      .type("grayscale")
      .compress("JPEG")
      .toBuffer(function (error, buffer) {
        if (error) {
          console.error("Error saving file", error);
          reject(error);
        } else {
          resolve({ buffer });
        }
      });
  });
};
