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

var reviewSchema = new Schema({
    movietitle: String,
    rating: Number,
    quote: String,
    reviewer: String,
});

//validate review rating, quote, reviewer, movieID
reviewSchema.pre('save', function(next) {
    let review = this;

    if (this.movietitle === null){
        return next({code: 400, message: "Invalid movie ID."})
    }
    //if (!this.movietitle.findOne({this.movietitle})){
    //    return next({code: 400, message: "Movie cannot be found."})
    //}
    if (this.quote === '') {
        return next({code: 400, message: "Quote cannot be null."})
    }
    if (this.rating === null || this.rating < 1 || this.rating > 5) {
        return next({code: 400, message: "Invalid rating."})
    }
    //valid review info
    next();
});

var Review = mongoose.model('Review', reviewSchema);

module.exports = Review;