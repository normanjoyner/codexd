'use strict';

function ESNAPSHOTNOTFOUND() {
    Error.captureStackTrace(this.constructor);
    this.name = this.constructor.name;
    this.message = 'The requested snapshot was unable to be found';
}

module.exports = {
    'ESNAPSHOTNOTFOUND': ESNAPSHOTNOTFOUND
};
