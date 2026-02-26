declare namespace Express {
    export interface Request {
        file?: Multer.File;
        files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }

    namespace Multer {
        export interface File {
            /** Name of the form field associated with this file. */
            fieldname: string;
            /** Name of the file on the uploader's computer. */
            originalname: string;
            /** The encoding type of the file. */
            encoding: string;
            /** The Mime type of the file. */
            mimetype: string;
            /** Size of the file in bytes. */
            size: number;
            /** The folder to which the file has been saved (DiskStorage). */
            destination: string;
            /** The name of the file within the destination (DiskStorage). */
            filename: string;
            /** Location of the uploaded file (DiskStorage). */
            path: string;
            /** A Buffer of the entire file (MemoryStorage). */
            buffer: Buffer;
        }
    }
}
