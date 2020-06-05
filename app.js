const fsPromises = require("fs").promises;
const exifParser = require("exif-parser");
const workingDir = process.cwd();

async function readExifDate(file) {
  const data = await fsPromises.readFile(file.name);
  var parser = exifParser.create(data);
  try {
    var exifData = parser.parse().tags; // Get exif data from image file
    const utcSeconds = exifData.DateTimeOriginal; // Get date from image file
    let date = new Date(0); // Create date
    date.setUTCSeconds(utcSeconds); // Add epoch time from image metadata
    const dateString = isNaN(date.getTime()) // Check if valid date
      ? "0000-00-00"
      : date.toISOString(); // Convert date to string
    return Promise.resolve(dateString.slice(0, 10));
  } catch (error) {
    return Promise.resolve("_nonphoto");
  }
}

async function getAvailableFileName(file) {
  let availableFileName = null;
  let count = 0;

  function getCurrentCopyName(fileName) {
    let reconstructed = "";
    const splitted = fileName.split(".");
    splitted.forEach((part, index) => {
      if (index === splitted.length - 1) {
        reconstructed = reconstructed.concat(`copy${count}.${part}`);
      } else {
        reconstructed = reconstructed.concat(`${part}.`);
      }
    });
    return reconstructed;
  }

  while (!availableFileName) {
    let alreadyExists;

    try {
      alreadyExists = await fsPromises.lstat(`${file.date}/${file.name}`);
    } catch (error) {
      return Promise.resolve(file); // File does not exist, keep original name
    }

    if (alreadyExists) {
      let checkCopy;
      ++count;
      try {
        checkCopy = await fsPromises.lstat(
          `${file.date}/${getCurrentCopyName(file.name)}`
        );
      } catch (error) {}
      if (!checkCopy) {
        availableFileName = `${getCurrentCopyName(file.name)}`;
      }
    }
  }
  return Promise.resolve({ ...file, newName: availableFileName });
}

async function moveFile(file) {
  try {
    await fsPromises.mkdir(`${workingDir}/${file.date}`, { recursive: false });
  } catch (e) {}
  const f = await getAvailableFileName(file);
  console.log(`Moving ${f.newName ? f.name + " -> " + f.newName : f.name}`);
  return fsPromises.rename(
    f.name,
    `${f.date}/${f.newName ? f.newName : f.name}`
  );
}

async function sort() {
  console.log("Starting sort...");
  const dir = await fsPromises.opendir(workingDir);

  for await (const entity of dir) {
    if (!entity.isDirectory()) {
      console.log(`Next: ${entity.name}`);
      const file = { name: entity.name };
      const date = await readExifDate(file);
      file.date = date;
      await moveFile(file);
    }
  }
  console.log("Complete.");
}

sort().catch((error) => console.error(error));
