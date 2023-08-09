import axios from "axios";
import fs from "fs";
import path from "path";

const EC2_URL = "http://54.149.151.221:8080";
const TABLE_NAME = "dev-digital-barcode-files";

const BARCODE_POSITION = "MIDDLE";
const EXPORT_TYPE = "PDF";
const OUTPUT_DIR = "/Users/ayusharora/Downloads/1687783126020";

const SOURCE_DIR = "/Users/ayusharora/Downloads/1687783126020";

async function addBarcodeToPdfs(payloads) {
  const promises = [];

  for (let payload of payloads) {
    const promise = axios
      .post(`${EC2_URL}/barcode`, payload)
      .then((res) => ({
        url: res?.data?.url,
        name: `${
          payload.params.barCodeText
        }-output.${EXPORT_TYPE.toLowerCase()}`,
      }))
      .catch((err) => {
        console.log(
          `error calling barcode api for barcode ${
            payload.params.barCodeText
          } : ${JSON.stringify(err?.response?.data)}`
        );
      });
    promises.push(promise);
  }

  console.info("Called barcode API to add barcode to pdfs");
  const response = await Promise.all(promises);
  console.info("barcode API responded");
  return response;
}

function readPdfsFromDir(dir) {
  const pdfFiles = [];
  fs.readdirSync(dir).forEach((fileName) => {
    if (fileName.slice(fileName.length - 4) === ".pdf") {
      const fileBuffer = fs.readFileSync(`${dir}/${fileName}`);
      pdfFiles.push({
        name: fileName,
        buffer: fileBuffer.buffer,
        path: `${dir}/${fileName}`,
      });
    }
  });

  console.info("Pdf files are read");
  return pdfFiles;
}

async function uploadFilesToS3AndExtractBarcode(files) {
  let promises = [];
  const fileCount = files.length;

  const barcodes = [];

  for (let i = 0; i < fileCount; i++) {
    const promise = axios
      .get(`${EC2_URL}/signedURL?tableName=${TABLE_NAME}`)
      .then((res) => {
        barcodes.push(res.data.object_key);
        return res.data.upload_url;
      })
      .catch((err) => console.error(err));

    promises.push(promise);
  }

  const presingnedUrls = await Promise.all(promises);
  console.info("Successfully fetched the get-presingned urls");

  promises = [];
  let itr = 0;
  for (let url of presingnedUrls) {
    const { buffer: fileBuffer, path: filePath } = files[itr];
    const promise = axios
      .put(url, fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": fs.statSync(filePath)["size"],
        },
      })
      .catch((err) => console.error(err.data));
    promises.push(promise);
    itr++;
  }

  console.info("Successfully uploaded pdf files");
  const response = await Promise.all(promises);
  return barcodes;
}

function generatePayloadForBarcode(barcodes) {
  const payloads = [];
  for (let barcode of barcodes) {
    payloads.push({
      params: {
        barCodeText: barcode,
        barcode_position: BARCODE_POSITION,
        export_type: EXPORT_TYPE,
      },
    });
  }

  console.info("Prepared payload for barcode api");
  return payloads;
}

async function downloadUpdatedFiles(presignedUrls) {
  for (const { url, name } of presignedUrls) {
    const outputPath = path.resolve(OUTPUT_DIR, name);

    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(outputPath, response.data);
  }
  console.info("Barcode updated files downloaded");
}

async function loadTest() {
  const pdfFiles = readPdfsFromDir(SOURCE_DIR);
  const barcodes = await uploadFilesToS3AndExtractBarcode(pdfFiles);
  const payloads = generatePayloadForBarcode(barcodes);
  const updatedFileUrls = await addBarcodeToPdfs(payloads);
  console.log(updatedFileUrls);
  //   await downloadUpdatedFiles(updatedFileUrls);
}

loadTest();
