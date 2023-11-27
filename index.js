const express = require('express');
const app = express();
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();
const port = process.env.PORT;
const multer = require('multer');

app.use(session({
  secret: `${process.env.SECRET}`, 
  resave: false,
  saveUninitialized: true,
}));

app.set('views', './views');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.use('/public', express.static('public'));
app.use(express.json());


app.use(express.urlencoded({ extended: true }));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); 
  },
});

const upload = multer({ storage: storage });


app.use(express.json());


app.get('/', async (req, res) => {
  if (typeof req.session.state === 'undefined') {
    req.session.state = {};
  }

  if (typeof req.session.state.userType === 'undefined') {
    req.session.state.userType = 'guest';
  }
  const allAuctions = await  axios.get(`${process.env.DOMAIN}/auction/getAll`);
  req.session.state.companiesss = await allAuctions.data.message;
  const spices = await axios.get(`${process.env.DOMAIN}/spice/getAll`);
  req.session.state.homeSpice = spices.data.message;
  if (req.session.state.userType === 'user' || req.session.state.userType === 'company') {
    res.status(200).render('home', { session: req.session });
  } else {
    req.session.state.userType = 'guest';
    res.status(200).render('home', { session: req.session });
  }
});

 
////////////////Auth\\\\\\\\\\\\\\\\\\\\\\\\\\\\\  
app.get('/user/login', async (req, res) => {
  req.session.state.page =  'login';
  const session = req.session;
  res.status(200).render('authentication',{session:session});
});
app.post('/user/login', async (req, res) => {
  try {
    if (typeof req.session.state === 'undefined') {
      req.session.state = {};
    }
  const requestData = {
    email: req.body.email,
    password: req.body.password,
   };

   const newUser = await axios.post(`${process.env.DOMAIN}/login/user`, requestData)
   if(newUser.data.message){
    req.session.state.email = requestData.email;
    req.session.state.page = 'home';
    req.session.state.userType = 'user';
    req.session.state.email = requestData.email;
    req.session.state.succuss = true;
    req.session.state.message = true;
    const session = req.session;
    res.status(200).render('home', {session: session , message: newUser.data.message});
   }
  } catch (error) {
    req.session.state = {
      page: 'login',
      isGeust: true,
    }  
    const session = req.session;
    res.status(200).render('authentication',{  message: error.response.data.error,session: session});
   }
});

app.get('/user/register', (req, res) => {
  if (typeof req.session.state === 'undefined') {
    req.session.state = {};
  }
  req.session.state.page = 'register';
  const session = req.session;
  res.status(200).render('authentication',{session:session});
});


app.post('/user/register', async (req, res) => {
  try {
    if (typeof req.session.state === 'undefined') {
      req.session.state = {};
    }
  const requestData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    mobileNumber: req.body.mobileNumber,
    password: req.body.password,
   };
   const newUser = await axios.post(`${process.env.DOMAIN}/register/user`, requestData)
   if(newUser.data.message) res.status(200).redirect('login'); 
  } catch (error) {
    req.session.state.page ='register';
    const session = req.session;
    res.status(200).render('authentication',{session:session, message: error.response.data.error});  }
})


app.post('/company/register', (req, res) => {
  const requestData = {
    companyName: req.body.companyName,
    registrationNumber: req.body.registrationNumber,
    email: req.body.email,
    phone: req.body.phone,
    state:req.body.state,
    district:req.body.district,
    locality:req.body.locality,
    password: req.body.password,
  };

  axios.post(`${process.env.DOMAIN}/register/company`, requestData)
  .then(response => {
      res.status(200).redirect('login'); 
  })
  .catch(error => {
      console.error('Error sending data to the other backend:', error);
      res.status(500).send('an error occured in your submit please try again:'+error.response.data.error);
  });
});

app.post('/company/login', (req, res) => {
  const requestData = {
    companyName: req.body.companyName,
    password: req.body.password,
};
   axios.post(`${process.env.DOMAIN}/login/company`, requestData)
   .then(response => {
    
     req.session.state.company = {
       companyName: requestData.companyName,
     };
    req.session.state.userType = 'company';

    
     res.status(200).render('home', { swalSuccess: 'you have succusfully loged in.', session: req.session });
   })
   .catch(error => {
         req.session.state.page == 'companylogin'

     console.error(error);
     res.status(200).render('authentication', { swalSuccess: 'the password is incorrect please try again',session: req.session });
   });
  });

app.get('/company/register', (req, res) => {
  if (typeof req.session.state === 'undefined') {
    req.session.state = {};
  }
  req.session.state.page = 'companyRegister';
  req.session.state.userType = 'company';
  const session = req.session;
  res.status(200).render('authentication',{session:session});
});

app.get('/company/login', (req, res) => {
  if (typeof req.session.state === 'undefined') {
    req.session.state = {};
  }
  req.session.state.page = 'companylogin';
  const session = req.session;
  res.status(200).render('authentication',{session:session});
});


app.post('/user/logout', async (req, res) => {
  req.session.destroy();
  setTimeout(() => {
  res.status(200).redirect('home'); 
  },3000);
});

app.post('/company/logout', (req, res) => {
  req.session.destroy();
  setTimeout(() => {
  res.status(200).redirect('home'); 
  },3000);
});

////////////////Profile\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ 
app.get('/user/profile', async (req, res) => {
  try {
    const requestData = req.session.state;
    req.session.part ='hi'
    console.log('1');
 const profileCardData = await axios.post(`${process.env.DOMAIN}/userProfile`, requestData);
 console.log('2');

 if(profileCardData.data.message){
  console.log('3');

  req.session.state.page = 'userProfile';
  req.session.state.user = profileCardData.data.message;
  req.session.state.description = 'Here you can update your credentials and post for auction';
  console.log('4');

  const spices = await axios.get(`${process.env.DOMAIN}/spice/getAll`);
  req.session.state.spices = spices.data.message;
  
  console.log('5');
  const companies = await  axios.get(`${process.env.DOMAIN}/auction/getAll`);
  req.session.state.companies = companies.data.message;
  console.log('6');
  res.status(200).render('profile', {session: req.session});
 }
  } catch (error) {
    console.log('7');
    res.status(200).render('home', {session: req.session,message: 'an error occured,please try again later'});
  }
 
});


app.post('/user/profile',upload.single('photo'),(req, res) => {
  const requestData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    mobileNumber: req.body.mobileNumber,
    userType: req.body.userType,
    photo:req.file
};
console.log(requestData,'kjhvgchgggvghghghhhhvh');
axios.post(`${process.env.DOMAIN}/userProfile/update`, requestData)
.then(response => {

    res.status(200).redirect('profile'); 
})
.catch(error => {
    console.error('Error sending data to the other backend:', error);
    res.status(500).send('an error occured in your submit please try again:'+error.response.data.error);
});
});


app.post('/user/addASpice', upload.single('photo'), (req, res) => {
  const selectedValue = req.body.companyName;
  if (typeof selectedValue === 'string') {
      const [companyName, startTime, endTime] = selectedValue.split('|');

      const request = {
          photo: req.file,
          name: req.body.spiceType,
          sellerId: req.body.sellerId,
          weight: req.body.weight,
          companyName: companyName,
          spiceType: req.body.spiceType,
          auctionDate: startTime,
          endTime: endTime,
          minimumPrice: req.body.minimumPrice,
          quality: {
              grade: req.body['quality.grade'],
              colour: req.body['quality.colour'],
              size: req.body['quality.size']
          }
      };

      axios
          .post(`${process.env.DOMAIN}/spice/create`, request)
          .then(response => {
              res.status(200).redirect('profile');
          })
          .catch(error => {
              console.error('Error sending data to the other backend:', error);
              res.status(200).render('home', {session: req.session,message: error.response.data.error });
          });
  } else {
    res.status(200).render('home', {session: req.session,message: 'an error occured,please try again later'});
  }
});


app.get('/company/profile', async (req, res) => {
  try {
    const requestData = req.session.state.company;
    req.session.part ='hi'
    console.log('1');
 const profileCardData = await axios.post(`${process.env.DOMAIN}/companyProfile`, requestData);
 console.log('2');

 if(profileCardData.data.message){
  console.log('3');

  req.session.state.page = 'userProfile';
  req.session.state.user = profileCardData.data.message[0];
  req.session.state.description = 'Here you can update your credentials and post an Auction';
  console.log('4');

  const spices = await axios.post(`${process.env.DOMAIN}/spice/getByCompanyName`, requestData);
  req.session.state.spices = spices.data.message;

  console.log('5');
  const companies = await axios.post(`${process.env.DOMAIN}/auction/getbyCompanyName`, requestData);
  req.session.state.companies = companies.data.message;
  console.log('6');
  res.status(200).render('companyProfile', {session: req.session});
 }
  } catch (error) {
    console.log('7');
    res.status(200).render('home', {session: req.session,message: 'an error occured,please try again later'});
  }
 
});



app.post('/company/profile',  upload.single('photo'),(req, res) => {
  const requestData = {
    companyName: req.body.companyName,
    registrationNumber: req.body.registrationNumber,
    state: req.body.state,
    district: req.body.district,
    locality: req.body.locality,
    registrationNumber: req.body.registrationNumber,
    email: req.body.email,
    phone: req.body.phone,
    userType: req.body.userType,
    photo:req.file
};
axios.post(`${process.env.DOMAIN}/companyProfile/update`, requestData)
.then(response => {
    res.status(200).redirect('profile'); 
})
.catch(error => {
    console.error('Error sending data to the other backend:', error);
    res.status(500).send('an error occured in your submit please try again:'+error.response.data.error);
});
});

app.post('/company/addAnAuction', (req, res) => {
  console.log('reached', req.body);

  const newData = {
    companyName: req.body.companyName,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  };

  axios
    .post(`${process.env.DOMAIN}/auction/company/create`, newData)
    .then(response => {
      res.status(200).redirect('profile');
    })
    .catch(error => {
      console.error('Error sending data to the other backend:', error);
      res.status(500).send('An error occurred in your submit. Please try again: ' + error.response.data.error);
    });
});


app.post('/company/spice/approve', async (req, res) => {
  try {
    console.log('1');
    if(!req.body) throw new Error('id not provided');
    console.log('2');
   console.log(req.body.id,'12124');
    const {
      id
    } = req.body;
    console.log('3');
    const approved = await axios.post(`${process.env.DOMAIN}/spice/update`, {id:id});
    console.log('4',approved.data.message);

    if(!approved) throw new Error('not able to approve');
    console.log('5');

    res.status(200).send('approved successfully');
  } catch (error) {
    console.log('6');

    res.status(500).send('An error occurred in your submit. Please try again: ' + error.response.data.error);
  }  
});

  /////////////auction\\\\\\\\\\\\\\\\\\
  app.get('/user/auction', async (req, res) => {
    try {
    const allAuctions = await  axios.get(`${process.env.DOMAIN}/auction/getAll`);
    req.session.state.companies = await allAuctions.data.message;
    res.status(200).render('auction',{session: req.session});
  } catch (error) {
      console.log(error.data);
  }
  });

  app.get('/user/auction/spice', async (req, res) => {
    try {


 
      if (req.session.state.userType === 'guest') {
        return res.status(200).redirect('/user/login');
      }
      if (typeof (req.session.state.user) === 'undefined') {
        return res.status(200).redirect('/user/auction');
      }
        res.status(200).render('auctionForSpice', { session: req.session });

    } catch (error) {
      res.status(200).render('home', {
        session: req.session,
        message: 'An error occurred, please try again later',
      });
    }
  });
  
let reloaded = false;

 let a;

  app.post('/user/auction/getByCompanyNameAndDate', async (req, res) => {
    try {
      console.log('reacheded,$$$$$$$$$$$$$$$$$$$$$,$$$$$$$$$$$$$$$$$$$$$');
      const allData = await axios.post(`${process.env.DOMAIN}/spice/getAllByCompanyNameAndDate`,req.body);
      req.session.state.spicess =  allData.data.message;
      console.log('$$$$$$$$$$$$$$$$$$',req.session.state.spicess[0].companyName,'$$$$$$$$$$$$$$$$$$');
      a = req.session.state.spicess[0].companyName;
      const profileCardData = await axios.post(`${process.env.DOMAIN}/userProfile`, req.session.state);
      req.session.state.user =  profileCardData.data.message;
      res.status(200).redirect('/user/auction/spice');
    } catch (error) {
      res.status(200).render('home', {session: req.session,message: 'an error occured,please try again later'});
    }
  });

  app.post('/checkCompanyChange', (req, res) => {
    console.log('**************$$$$$$$$$$$$$$$$$$$$$',req.body.companyName,'$$$$$$$$$$$$$$$$$$');
    console.log('**************$$$$$$$$$$$$$$$$$$$$$',a,'$$$$$$$$$$$$$$$$$$');


    if (a !== req.body.companyName) {
      res.json({ companyChanged: false });
    }
      else {
      res.json({ companyChanged: true });
    }
  });

  app.post('/user/auction/spice/bid', async (req, res) => {
    try {
      const allData = await axios.post(`${process.env.DOMAIN}/spice/bid`,req.body);
      req.session.state.spicess = req.session.state.spicess.map(spice => {
        if (spice._id === allData.data.message._id) {
            return {
                ...spice,
                bidPrice: allData.data.message.bidPrice,
                holderFirstName: req.session.state.user.firstName,
                holderLastName:req.session.state.user.lastName
            };
        } else {
            return spice;
        }
    });
    res.status(200).render('auctionForSpice',{session: req.session});

    } catch (error) {
      res.status(200).render('home', {session: req.session,message: 'an error occured,please try again later'});
    }
  });
app.listen(port, () => {
    console.log('server is running:',port)
 });
