/*
 * @author Micael Gallego (micael.gallego@gmail.com)
 * @author Raquel Díaz González
 */

kurento_room.controller('teamController', function ($scope, $http, $route, $routeParams, ServiceParticipant, $window, serviceUser, serviceRoom, serviceTeam, serviceParticipate, serviceKurentoRoom, LxNotificationService,  LxDialogService) {
  
    $http.get('/getAllRooms').
	    success(function (data, status, headers, config) {
	        console.log(JSON.stringify(data));
	        $scope.listRooms = data;
	    }).
	    error(function (data, status, headers, config) {
    });

	$http.get('/getClientConfig').
	     success(function (data, status, headers, config) {
	    	console.log(JSON.stringify(data));
	    	$scope.clientConfig = data;
	     }).
	     error(function (data, status, headers, config) {
	    	 
	     });

	$scope.user=serviceUser.getSession();
	$scope.teams=serviceTeam.getTeams();
	$scope.rooms=serviceRoom.getRooms();
	$scope.participate = function(){
		var participates=0;
		if ($scope.user.name){
			for (var i=0;i<serviceParticipate.getParticipates().length; i++){
				if ((serviceParticipate.getParticipates()[i].iduser==$scope.user.id)&&(serviceParticipate.getParticipates()[i].team==$routeParams.id)){
					participates=1;
				}
			}
		}
		return participates;
	};
	
	$scope.logout = function(){		
		serviceUser.logout();
		$window.location.href = '#/';
		LxNotificationService.success("¡Hasta pronto!");
}
	
	$scope.newRoom = function(room){
		if (room.privileges){
			room.privileges=1;
		}
		else{
			room.privileges=0;
		}
		room.team=$scope.team.id;
		serviceRoom.newRoom(room);
		$route.reload();
		LxNotificationService.success("Room "+room.name+" created!");	
	};
	

	$scope.register = function (roomname) {
	
		$scope.roomName = roomname;
		
		var wsUri = 'ws://' + location.host + '/room';
		
		//show loopback stream from server
		var displayPublished = $scope.clientConfig.loopbackRemote || false;
		//also show local stream when display my remote
		var mirrorLocal = $scope.clientConfig.loopbackAndLocal || false;
		
		var kurento = KurentoRoom(wsUri, function (error, kurento) {
		
		    if (error)
		        return console.log(error);
		
		    //TODO token should be generated by the server or a 3rd-party component  
		    //kurento.setRpcParams({token : "securityToken"});
		
		    room = kurento.Room({
		        room: $scope.roomName,
		        user: $scope.user.name
		    });
		
		    var localStream = kurento.Stream(room, {
		        audio: true,
		        video: true,
		        data: true
		    });
		
		    localStream.addEventListener("access-accepted", function () {
		        room.addEventListener("room-connected", function (roomEvent) {
		        	var streams = roomEvent.streams;
		        	if (displayPublished ) {
		        		localStream.subscribeToMyRemote();
		        	}
		        	localStream.publish();
		            serviceKurentoRoom.setLocalStream(localStream.getWebRtcPeer());
		            for (var i = 0; i < streams.length; i++) {
		                ServiceParticipant.addParticipant(streams[i]);
		            }
		        });
		
		        room.addEventListener("stream-published", function (streamEvent) {
		        	 ServiceParticipant.addLocalParticipant(localStream);
		        	 if (mirrorLocal && localStream.displayMyRemote()) {
		        		 var localVideo = kurento.Stream(room, {
		                     video: true,
		                     id: "localStream"
		                 });
		        		 localVideo.mirrorLocalStream(localStream.getWrStream());
		        		 ServiceParticipant.addLocalMirror(localVideo);
		        	 }
		        });
		        
		        room.addEventListener("stream-added", function (streamEvent) {
		            ServiceParticipant.addParticipant(streamEvent.stream);
		        });
		
		        room.addEventListener("stream-removed", function (streamEvent) {
		            ServiceParticipant.removeParticipantByStream(streamEvent.stream);
		        });
		
		        room.addEventListener("newMessage", function (msg) {
		            ServiceParticipant.showMessage(msg.room, msg.user, msg.message);
		        });
		
		        room.addEventListener("error-room", function (error) {
		            ServiceParticipant.showError($window, LxNotificationService, error);
		        });
		
		        room.addEventListener("error-media", function (msg) {
		            ServiceParticipant.alertMediaError($window, LxNotificationService, msg.error, function (answer) {
		            	console.warn("Leave room because of error: " + answer);
		            	if (answer) {
		            		kurento.close(true);
		            	}
		            });
		        });
		        
		        room.addEventListener("room-closed", function (msg) {
		        	if (msg.room !== $scope.roomName) {
		        		console.error("Closed room name doesn't match this room's name", 
		        				msg.room, $scope.roomName);
		        	} else {
		        		kurento.close(true);
		        		ServiceParticipant.forceClose($window, LxNotificationService, 'Room '
		        			+ msg.room + ' has been forcibly closed from server');
		        	}
		        });
		        
		        room.connect();
		    });
		
		    localStream.addEventListener("access-denied", function () {
		    	ServiceParticipant.showError($window, LxNotificationService, {
		    		error : {
		    			message : "Access not granted to camera and microphone"
		    				}
		    	});
		    });
		    localStream.init();
		});
		
		//save kurento & roomName & userName in service
		serviceKurentoRoom.setKurento(kurento);
		serviceKurentoRoom.setRoomName($scope.roomName);
		serviceKurentoRoom.setUserName($scope.user.name);
		
		//redirect to call
		$window.location.href = '#/call';
	};
    
	$scope.opendDialog = function(dialogId){
	    LxDialogService.open(dialogId);
	};
	
	$scope.closingDialog = function(dialogId){
	    LxDialogService.close(dialogId);
	};
	
    
});