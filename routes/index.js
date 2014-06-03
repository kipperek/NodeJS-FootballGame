exports.index = function (req, res) {
	req.logout();
    res.render('index', {
        title: 'Paper football'
    });
};

function regResponse(msg, done){
	return {
		"msg": msg,
		"done": done
    }  
}

exports.register = function (req, res) {
	var resMsg = false;
	var resDone = false;
	var db = req.app.locals.footballDB;

	if(req.params[0].match(/\W/g) != "" && req.params[0].match(/\W/g) != null)
		 res.json(regResponse("Username contains forbidden characters", false)); 
	else
	//POŁĄCZ
	db.open(function (err) {
		//ZNAJDZ KOLEKCJE USERS
		db.collection('users', function (err, coll) {
			//sprawdz czy istnieje user o podanym username
			coll.findOne({"username": req.params[0]}, function (err, item) {
				if(item == null){
					//DODAJ USERA jeżeli nie znaleziono userka
			        coll.insert({"username": req.params[0], "pass": req.params[1]}, function (err) {
			        	//SPRAWDZ CZY DOBRZE DODANE 
			        	coll.findOne({"username": req.params[0]}, function (err, addeditem) {
				            db.close(); 
				            res.json(regResponse("New user registered succefully,<br/>You may log in now", true)); 
				        });
			        });
			    }else{
			    	//jeżeli user juz istnieje to powiadom
			    	db.close();   
				    res.json(regResponse("User with that name already exists", false)); 
			    }
	    	});
	    });
	});

};


