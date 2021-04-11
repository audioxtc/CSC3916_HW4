let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath});
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../Users');
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test',
    username: 'email@email.com',
    password: '123@abc'
}

let movie_details = {

}

let review_details = {
    movietitle: "Swingers",
    rating: 5,
    username: User.username,
    quote: "A totally awesome film about guys searching for their dating identity."
    //leadactors: [
    //    {actorName: 'Hugh Grant', characterName: 'William Thacker'},
    //    {actorName: 'Julia Roberts', characterName: 'Anna Scott'},
    //    {actorName: 'Rhys Ifans', characterName: 'Spike'}
    //]
}

describe('Register, Login and Call Test Collection with Basic Auth and JWT Auth', () => {
   before((done) => { //Before each test initialize the database to empty
       //db.userList = [];
       User.deleteOne({ name: 'test'}, function(err, user){
           if (err) throw err;
       });
       done();
    })

    after((done) => { //after this test suite empty the database
        //db.userList = [];
        User.deleteOne({ name: 'test'}, function(err, user) {
            if (err) throw err;
        });
        done();
    })

    //Test the GET route
    describe('/signup', () => {
        it('it should register, login and check our token', (done) => {
          chai.request(server)
              .post('/signup')
              .send(login_details)
              .end((err, res) =>{
                console.log(JSON.stringify(res.body));
                res.should.have.status(200);
                res.body.success.should.be.eql(true);
                //follow-up to get the JWT token
                chai.request(server)
                    .post('/signin')
                    .send(login_details)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        let token = res.body.token;
                        console.log(token);
                        chai.request(server)
                            .get('/movies/?reviews=True')
                            .set('Authorization', token)
                            .send()
                            .end((err, res) => {
                                res.should.have.status(200);
                                //chai.request(server)
                                //    .post('/reviews')
                                //    .set('Authorization', token)
                                //    .send(review_details)
                                //    .end((err, res) => {
                                //        res.should.have.status(200);
                                //        done();
                                   // })
                            })
                    })
              })
        })
    });

});
