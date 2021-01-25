dbPassword = 'mongodb+srv://admin:'+ encodeURIComponent('admin*123') + '@cluster0.aagu9.mongodb.net/test?retryWrites=true&w=majority';
module.exports = {
    mongoURI: dbPassword
};
