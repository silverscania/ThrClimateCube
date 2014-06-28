/** 
 *	@class IsoCamera
 *	
 *	Camera that is used in the climate cube
 *	Gives an isometric look by being orthographic
 *	and having a fixed position in y
 *
 *	Inherits THREE.OrthographicCamera
 *
 *	Has functions for getting a pick ray
 *
 *	see THREE.OrthographicCamera for params
 *	
 *	@inherits THREE.OrthographicCamera
 **/
IsoCamera = function( left, right, top, bottom, near, far){
	
	this.cameraRotation = 0.0;
	this.lookAtPoint = new THREE.Vector3(0,0,0);
	this.angularVelocity = 0.3;
	
	//this.rotationGoal=0;
	this.lastRotationGoal=0.0;
	this.rotationOnMouseDown =0.0;
	
	//this.angularAcceleration=0;
	this.dampening = .5;
	this.orthoSize = 30;
	
	var aspect = window.innerWidth / window.innerHeight;
	
	THREE.OrthographicCamera.call(this, -this.orthoSize, this.orthoSize, this.orthoSize / aspect, -this.orthoSize / aspect, 0.01, 100);
	this.zoom(0);
	
};

IsoCamera.prototype = new THREE.OrthographicCamera();
IsoCamera.prototype.constructor = IsoCamera;
IsoCamera.prototype.supr = THREE.OrthographicCamera.prototype;


/**
 * 	Update function, moves camera based on its angular Velocity
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - delta seconds
 **/
IsoCamera.prototype.update = function(currentTime, delta, rotationGoal){
	
	if(leftClick)
	{
		//spring equation
		//F = -kx - bV
		// k = spring const
		// x = displacement
		// b = dampening
		// v = relative velocity
		var normedRotationGoal = -rotationGoal / window.innerWidth;
		
		var rotationGoalSpeed = (normedRotationGoal - this.lastRotationGoal) / delta;
		this.lastRotationGoal = normedRotationGoal;
		
		//add starting rotation to goal, so no change is seen on mouse down only
		//rotation goal is original + offset of mouse
		normedRotationGoal = this.rotationOnMouseDown + (normedRotationGoal - this.mouseXOnMouseDown);
		
		//F = ma
		//m = 1
		//therefore F = a
		var x = this.cameraRotation - normedRotationGoal;
		var v = this.angularVelocity - rotationGoalSpeed;

		//F = -kx - bV
		var angAcceleration = (-20 * x) - (this.dampening * v);

		//now copy this spring equation stuff into the actual position
		this.angularVelocity += angAcceleration * delta;	
	}

	this.cameraRotation += this.angularVelocity * delta;
  
	this.camPos = new THREE.Vector3();
	this.camPos.x = 40 * Math.sin(this.cameraRotation);
	this.camPos.z = 40 * Math.cos(this.cameraRotation);

	this.position.y = 40;
	this.position.x = this.camPos.x + this.lookAtPoint.x;
	this.position.z = this.camPos.z + this.lookAtPoint.z;

	this.lookAt(this.lookAtPoint );	
};


/**
 * 	Add to zoom and update
 *
 * 	@param currentTime - game time in milliseconds
 *	@param delta - delta seconds
 **/
IsoCamera.prototype.zoom = function(wheelDelta){		

	this.orthoSize -= wheelDelta / 60;

	if(this.orthoSize < 2) this.orthoSize = 2;
	if(this.orthoSize > 70) this.orthoSize = 70;
	
	var aspect = window.innerWidth / window.innerHeight;
	
	this.left = -this.orthoSize;
	this.right = this.orthoSize;
	this.top = this.orthoSize / aspect;
	this.bottom = -this.orthoSize / aspect;

	this.updateProjectionMatrix();		
};


/**
 * 	Move the camera and its look at point in X,Z
 *
 * 	@param mouseVec - distance that the mouse has moved
 **/
IsoCamera.prototype.pan = function(mouseVec){
	
	var offsetVect = this.camPos; 
	offsetVect.y = 0;
	offsetVect = offsetVect.normalize();

	var zAddition = (offsetVect.dot(mouseVec)) * (mouseVec.length() * (Math.log(this.orthoSize) / 6));

	//rotate offset by 90 (x, y, z) -> (-z, y, x)
	var offsetRot = new THREE.Vector3();
	offsetRot.x = -offsetVect.z;
	offsetRot.y = offsetVect.y;
	offsetRot.z = offsetVect.x;

	var xAddition = (offsetRot.dot(mouseVec)) * (mouseVec.length() * (Math.log(this.orthoSize) / 6));

	this.lookAtPoint.x -= xAddition; 
	this.lookAtPoint.z -= zAddition;
};


/**
 * 	Returns a ray from the camera, given a mouse coordinate
 *
 *	returned form is ["src":source Vector, "vector": ray vector]
 **/
IsoCamera.prototype.getPickRay = function(mouseX, mouseY){
	
	//create normalised mouse position
	var mouseVec = new THREE.Vector3();
	mouseVec.x = -((mouseX / (window.innerWidth)) - .5);
	mouseVec.y = (mouseY / (window.innerHeight)) - .5;				


	//multiply mouse vector by viewing planes, to get a straight vector
	var near = new THREE.Vector3();
	near.x = -mouseVec.x * (this.right - this.left);
	near.y = -mouseVec.y * (this.top - this.bottom);


	//create ray that is in Z, as camera is orthographic
	ray = new THREE.Vector3(0,0,-1);

	//extract rotation from camera matrix
	var camRotation = new THREE.Matrix4();
	camRotation.extractRotation(this.matrix);

	//rotate ray by camera rotation
	ray = camRotation.multiplyVector3(ray);

	//make ray start from camera position + mouse position
	//rotate mouse position by camera rotation too
	var raySource = near.clone();
	raySource = camRotation.multiplyVector3(raySource);
	raySource.addSelf(this.position);

	return {"src" : raySource, "vector" : ray};
};


/**
 * 	Returns a point on the pick ray that is 3 units off the ground
 *	Does this using a ray, plane intersection equation
 *	returns a vector
 **/
IsoCamera.prototype.getLinePlaneIntersection = function(mouseX, mouseY){
			
	//plane equation is (p - p0) . n = 0

	//define plane vector and a point on the plane
	var n = new THREE.Vector3(0,1,0);
	var p0 = new THREE.Vector3(0,3,0);

	//get ray source and direction
	var pickRay = this.getPickRay(mouseX, mouseY);
	var l0 = pickRay["src"];
	var l = pickRay["vector"];


	var numerator = p0.clone().subSelf(l0).dot(n);
	var denominator = l.clone().dot(n);

	//distance along line
	var d = numerator / denominator;

	return l.multiplyScalar(d).addSelf(l0);

}


IsoCamera.prototype.mouseDown = function(mouseX){
		
		this.lastRotationGoal = -mouseX / window.innerWidth; 
		this.rotationOnMouseDown = this.cameraRotation;
		this.mouseXOnMouseDown = -mouseX / window.innerWidth;
		
		this.dampening = 6;
};

IsoCamera.prototype.mouseUp = function(){
	this.dampening = 0.5;
};