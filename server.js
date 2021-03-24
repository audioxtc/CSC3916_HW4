/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Actor = require('./Actors');


var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function (err) {
            if (err) {
                if (err.code == 11000)
                    return res.json({success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function (isMatch) {
            if (isMatch) {
                var userToken = {id: user.id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

//implement movie route
router.get('/movies', authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        //var movie = new Movie();
        Movie.find({}, function(err, movies){
            if (err) {
                res.status(405).send(err);
                console.log(movies);
            }
            else{
                var o = getJSONObjectForMovieRequirement(req);
                res = res.status(200);
                o.body = {msg: [movies]};
                res.json(o);
            }
        })

    });

router.get('/movies/:movieID', authJwtController.isAuthenticated, function (req, res) {
    let movieID
    console.log(req.body);
    //var movie = new Movie();
    Movie.find({}, function(err, movies){
        if (err) {
            res.status(405).send(err);
            console.log(movies);
        }
        else{
            var o = getJSONObjectForMovieRequirement(req);
            res = res.status(200);
            o.body = {msg: [movies]};
            res.json(o);
        }
    })

});

    /*
    .put(authJwtController.isAuthenticated, function (req, res) {
        movie = new Movie();
        movie.findById({id: req.body.id}, function(err, movie){
            if (err){
                res.status(405).send(err)
            }
            else {
                movie.leadActors = req.body.leadactors;
                movie.title = req.body.title;
                movie.year = req.body.year;
                movie.genre = req.body.genre;
                //movie.id = req.body.movieid;
                var o = getJSONObjectForMovieRequirement(req);
                res = res.status(200);
                o.body = {msg: "movie updated."}
                res.json(o);
            }
        })
        console.log(req.body);

        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        o.body = {msg: "movie updated."}
        res.json(o);
    }


)

     */

router.delete('/movies', authJwtController.isAuthenticated, function (req, res) {
    //if (req.get('Content-Type')) {
    //    res = res.type(req.get('Content-Type'));
    //}
    if (req.body.title) {
        Movie.findOneAndDelete({title: req.body.title}, function (err, docs) {
            if (err) {
                res.status(405).send(err);
                console.log(err, docs);
                return res.json(err);
            }
            if (docs === null){
                res=res.status(401);
                return res.json("Movie not found.");
            }
            else {
                res = res.status(200);
                console.log(docs);
                var o = getJSONObjectForMovieRequirement(req);
                o.body = {msg: "movie deleted."}
                res.json(o);
            }
        });
    }
    if (req.body.id){
        console.log("got to id");

        Movie.find({_id: req.body.id}), function (err, docs) {
            if (err) {
                res.status(405).send(err);
                console.log(err);
                return res.json(err);
            }
            else {
                res = res.status(200);
                console.log("Movie deleted successfully:", docs);
                var o = getJSONObjectForMovieRequirement(req);
                o.body = {msg: "movie deleted."}
                res.json(o);
            }
        }
    }

});


router.post('/movies', authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var movie = new Movie();
        movie.leadActors = req.body.leadactors;
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        //movie.id = req.body.movieid;
        movie.save(function (err)  {
            if (err) {
                res.status(405).send(err);
                console.log(err);
            }
            else {
                var o = getJSONObjectForMovieRequirement(req);
                res = res.status(200);
                o.body = {msg: "movie saved."};
                res.json(o);
            }
        });
        //console.log('Movie saved.');
    });

router.put('/movies', authJwtController.isAuthenticated,
    function(req, res) {
    //var iD = req.params.id;
    //var movie = new Movie();
    //movie2.title = req.params.title;
    //var o_id = new ObjectID();
    Movie.findOne({title: req.body.title},function(err, movie) {
        console.log(movie);
        if (err){
            res.status(405).send(err);
        }
        else {
            if (req.body.year){
                movie.year = req.body.year;
            }
            if (req.body.genre){
                movie.genre = req.body.genre;
            }
            if (req.body.leadactors){
                for (let i=0; i<req.body.leadactors.length; i++){
                    movie.leadActors[i].actorName = req.body.leadactors[i].actorName;
                    movie.leadActors[i].characterName = req.body.leadactors[i].characterName;
                }
            }
            console.log(movie);
            movie.save(function(err){
                if (err){
                    res.status(405).send(err);
                }
                else {
                    console.log(movie);
                    var o = getJSONObjectForMovieRequirement(req);
                    res = res.status(200);
                    o.body = {msg: "movie updated."}
                    res.json(o);
                }
                });
            }
        });
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


