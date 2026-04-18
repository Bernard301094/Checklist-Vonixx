function doGet(e) {
  // Responde ao preflight CORS
  return ContentService.createTextOutput("OK");
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderId = "1t2X0twCSeZp1SPKQbKxOF8_8mmIXYM6o";
    var folder = DriveApp.getFolderById(folderId);

    // Suporta campo 'base64' (novo frontend) e 'photo' (legado com prefixo data:URI)
    var imageData;
    var mimeType = data.mimeType || 'image/jpeg';

    if (data.base64) {
      imageData = data.base64;
    } else if (data.photo) {
      imageData = data.photo.replace(/^data:image\/\w+;base64,/, "");
    } else {
      throw new Error("Nenhuma imagem recebida.");
    }

    var filename = data.filename || ("foto_" + Date.now() + ".jpg");
    var blob = Utilities.newBlob(Utilities.base64Decode(imageData), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      url: file.getUrl(),
      fileUrl: file.getUrl(),
      driveUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
