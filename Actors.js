var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//mongoose.Promise = global.Promise;


try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

var actorSchema = new Schema({
    actorid: Number,
    actorName: String,
    characterName: String

});

var Actor = mongoose.model('Actor', actorSchema);

module.exports = Actor;
