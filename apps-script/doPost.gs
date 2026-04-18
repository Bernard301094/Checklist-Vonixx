function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var folderId = "1t2X0twCSeZp1SPKQbKxOF8_8mmIXYM6o";
    var folder = DriveApp.getFolderById(folderId);

    // Suporte a ambos os formatos:
    // - Novo (frontend React): { base64: "...", mimeType: "image/jpeg", filename: "..." }
    // - Legado (caso ainda enviado): { photo: "data:image/jpeg;base64,...", filename: "..." }
    var imageData;
    var mimeType;

    if (data.base64) {
      // Novo formato: base64 puro sem prefixo
      imageData = data.base64;
      mimeType = data.mimeType || 'image/jpeg';
    } else if (data.photo) {
      // Formato legado: remove o prefixo data:image/...;base64,
      imageData = data.photo.replace(/^data:image\/\w+;base64,/, "");
      mimeType = 'image/jpeg';
    } else {
      throw new Error('Nenhuma imagem recebida. Envie "base64" ou "photo".');
    }

    var filename = data.filename || ('foto_' + Date.now() + '.jpg');
    var blob = Utilities.newBlob(Utilities.base64Decode(imageData), mimeType, filename);
    var file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      url: file.getUrl(),        // URL de visualizacao no Drive
      fileUrl: file.getUrl(),    // alias para compatibilidade
      driveUrl: file.getUrl(),   // alias para compatibilidade
      downloadUrl: file.getDownloadUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
