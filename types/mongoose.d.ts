import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: any;
    promise: Promise<any> | null;
  } | undefined;
}

