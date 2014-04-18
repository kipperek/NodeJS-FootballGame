function setSocket(io){

    var redTeam = [];
    var blueTeam = [];
    //socket 
    var dane = {
            user: "",
            now: "b",
            moves:
            [{
                x: 8,
                y: 11
            },
            {
                x: 7,
                y: 11
            }],
            current: {x: 7, y:10},
            path:[]
        }

    io.sockets.on("connection", function (socket) {
        socket.on("message", function (data) {
            if(data != "start")
                dane = JSON.parse(data);

            io.sockets.emit("echo",JSON.stringify(dane));
            //wysylam date
        });
        socket.on("error", function (err) {
            console.dir(err);
        });
    });

}
module.exports.setSocket = setSocket;