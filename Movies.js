var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Actor = require('./Actors');

//mongoose.Promise = global.Promise;

var actorlist = [];

try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

var actor = new Actor();

//create a schema
var movieSchema = new Schema({

    title: {type: String, required: true, index: {unique: true, dropDups: true }},
    year: Number,
    //Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Thriller,
    //         Western
    genre: String,
    //must have at least three
    leadActors: [{
        actorName: String,
        characterName: String
    }],
    imageUrl: String

});

//validate year, number of actors, genre
movieSchema.pre('save', function(next) {
    let movie = this;
    const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western'];
    let date = new Date();
    if (this.title === '') {
        return next({code: 400, message: "Title cannot be null."})
    }
    if (this.year === null || this.year > date.getFullYear()) {
        return next({code: 400, message: "Invalid year."})
    }
    if (!genres.includes(this.genre) || this.genre === '') {
        return next({code: 400, message: "Invalid genre."})
    }
    if (this.leadActors.length < 3) {
        return next({code: 400, message: "Movie must contain minimum 3 actors."})
    }
    for (i=0; i<this.leadActors.length; i++) {
        if (this.leadActors[i].actorName === '' || this.leadActors[i].characterName === '') {
            return next({code: 400, message: "actor name or character name cannot be null."})
        }
    }
    if (this.imageUrl === null){
        return next({code: 400, message: "Image url cannot be blank."})
    }
    //valid movie info
    next();
});

var Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;

