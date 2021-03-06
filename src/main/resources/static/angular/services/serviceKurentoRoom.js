/*
 * @author Raquel Díaz González
 */

kurento_room.service('serviceKurentoRoom', function () {

    var kurento;
    var team;
    var roomName;
    var userName;
    var localStream;

    this.getKurento = function () {
        return kurento;
    };
    
    this.getTeam = function () {
    	return team;
    };

    this.getRoomName = function () {
        return roomName;
    };

    this.setKurento = function (value) {
        kurento = value;
    };
    
    this.setTeam = function (value) {
    	team = value;
    };

    this.setRoomName = function (value) {
        roomName = value;
    };

    this.getLocalStream = function () {
        return localStream;
    };

    this.setLocalStream = function (value) {
        localStream = value;
    };

    this.getUserName = function () {
        return userName;
    };

    this.setUserName = function (value) {
        userName = value;
    };
});
