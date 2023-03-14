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
