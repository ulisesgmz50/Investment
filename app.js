const express = require('express');
const app =express();

//esto es para capturar datos del form
app.use(express.urlencoded({ extended:false }));
app.use(express.json());


 const dotenv = require('dotenv');
 dotenv.config({path:'./env/.env'});

 app.use('/resources', express.static('public'));
 app.use('/resources', express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

const bcryptjs = require('bcryptjs');

const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const connection = require('./database/db');


app.get('/register', (req, res) => {
    res.render('register');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/companys', (req, res) => {

    if(req.session.loggedin) {
    const name = req.session.name;
    const login = true;
    //const balance = req.session.balance;
    connection.query('SELECT * FROM user WHERE login = ?', [name], async (error, results) => {
        if(error) {
            console.log(error);
        }else{
            console.log(results);
            //req.session.loggedin = true;
            //req.session.name =results[0].login;
               req.session.balance = results[0].balance;
        }
    })

    connection.query('SELECT * FROM company',(error, companys) => {
        if (error) {
            console.log(error);
    }else{
        console.log(companys);
        res.render('companys', {
            data: companys,
            name: name,
            login: login,
            balance: req.session.balance
        });

    }})
    }else{
    res.render('companys', {
        login: false,
        name: 'Inicia sesion para poder invertir'
    })
    }

    })


app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass,8);
    if(user && pass){
        connection.query('SELECT * FROM user WHERE login = ?', [user], async (error, results) => {
            console.log(error);
            console.log(results);
            if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].passcode))){
                res.render('login',{
                    alert: true,
                    alertTitle: 'Error!',
                    alertMessage: 'User or Password incorrect :(',
                    alertIcon: 'error',
                    showConfirmButton: true,
                    timer:false,
                    ruta:'login'
                });
            }else{
                req.session.loggedin = true;
                req.session.name =results[0].login;
                req.session.balance = results[0].balance;
                res.render('login',{
                    alert: true,
                    alertTitle: 'Welcome!',
                    alertMessage: 'User Loged in successfully! :)',
                    alertIcon: 'success',
                    showConfirmButton: false,
                    timer:1500,
                    ruta:'companys'
                });
                //res.send('Login correcto');
            }
        })
    }
    })
    

    app.post('/companysvalidation', async (req, res) => {
        const companyid = req.body.CompanyID;
        const balance = req.session.balance;
        const login = true;
        const data = req.body.data;
        const amount = req.body.amount;
        const name = req.session.name;
/*
        connection.query('SELECT * FROM company',(error, companys) => {
            if (error) {
                console.log(error);
        }else{
            console.log(companys);
            //res.render('companys', {
              //  data: companys,
               // name: name,
                //login: login,
                //balance: balance
            //});
        }})
*/
        connection.query('SELECT * FROM company where ID = ?', [companyid], async (error, result) => {
            if(error){
                console.log(error);
            }else{
                const newcompanyinvestedtotal = parseInt(result[0].investedtotal) + parseInt(amount) ;
                const newbalance = parseInt(balance) - parseInt(amount) ;
                const companyname = result[0].companyname;
                if(balance>=amount && newcompanyinvestedtotal<=result[0].investtotal && newbalance>=0){
                    
                    connection.query('Insert into movements set ?',{username:name,companyname:companyname,amount:amount}, async (error, result) => {
                        if(error){
                        console.log(error);
                        }else{
                            console.log(result);
                        }
                    })

                    connection.query('update company set investedtotal = ? where ID = ?',[newcompanyinvestedtotal, companyid], async (error, result) => {
                        if (error) {
                           // console.log(error);
                        }else{
                            //console.log(result);
                        }
                    })

                    connection.query('update user set balance = ? where login = ?',[newbalance, name], async (error, result) => {
                        if (error) {
                            //console.log(error);
                        }else{
                            //console.log(result);
                        }
                    })
                req.session.loggedin = true;
                req.session.name =name;
                req.session.balance = balance;
                    res.render('companys',{
                        alert: true,
                        alertTitle: 'Congratulations!',
                        alertMessage: 'Invest has been successfully',
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer:1500,
                        name: name,
                        login: login,
                        data: data,
                        balance: newbalance,
                        ruta:'companys'
                    })
                }else{
                req.session.loggedin = true;
                req.session.name = name;
                req.session.balance = balance;
                    res.render('companys',{
                        alert: true,
                        alertTitle: 'Invest fail!',
                        alertMessage: 'something went wrong :( Check investment limit or balance',
                        alertIcon: 'error',
                        showConfirmButton: false,
                        timer:1500,
                        ruta:'companys',
                        name: name,
                        login: login,
                        data: data,
                        balance: newbalance
                    })
                }
                
            }
        })
        
    })

app.post('/register', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    const balance = req.body.balance;
    let passwordHash = await bcryptjs.hash(pass,8);
    connection.query('Insert into user set ?',{login:user,passcode:passwordHash,balance:balance}, async (error, result) => {
        if(error){
        console.log(error);
        }else{
            res.render('register',{
                alert: true,
                alertTitle: 'singedd up',
                alertMessage: 'User signed up successfully!',
                alertIcon: 'success',
                showConfirmButton: false,
                timer:1500,
                ruta:''
            })
        }
})
})


app.get('/', (req, res) => {
    if(req.session.loggedin) {
        res.render('index', {
            login: true,
            name: req.session.name
        });
    }else{
        res.render('index', {
            login: false,
            name: 'Inicia sesion para poder invertir'
        })
        }
})

app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

app.listen(3000,(request,response) => {
    console.log('Server running on http://localhost');

})