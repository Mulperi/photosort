# Photosort

Sort photos into folders by date, based on EXIF-metadata.

## Installation

```sh
npm i -g @mulperi/photosort
```

## Running

Run photosort inside the directory where the image files are located.

```sh
npx photosort
```

- New directories will be created (e.g. **`2020-06-05`**) based on the date information of image files.
- If the date directory already has file by the same name, a new name will be given to the file that is moved (copy1...).
- Files that have no EXIF-data will be moved to **`_nonphoto`** directory.
