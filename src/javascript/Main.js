/**
 * global file conaining all objects, game loop, camera
 * etc.
 **/
 
var container, stats;
var camera, scene, renderer;

//light used to illuminate temporary lambert models
var tempLight;

//variables for game loop
var startTime = new Date().getTime();
var lastTime = new Date().getTime();

//scene objects (all inherit from THREE.Mesh)
var sadPostFlag;
var happyPostFlag;
var iceCube;
var iceCubeMaxScale = 3;
var glowingRoof;
var billboards = new Array();
var pedestrians = new Array();
var pickedPedestrian = null;
var clouds = new Array();

//gui and its data struct
var gui;
var guiResults = {
	climateAppreciationValue: 0.5,
	useRealTwitterData: true
};

//keeps track of post reading 
var twitterClimateAppreciationValue = 0.5;
var lastClimateAppreciationValue = 0.5;

/**
 *	Loads everything and adds it to the scene
 **/
function init() {

	container = document.getElementById( 'container' );

	scene = new THREE.Scene();
	camera = new IsoCamera(); 
	scene.add( camera );

	/**Shadow light**/
	var shadowLight;
	shadowLight = new THREE.SpotLight( 0xffffff );
	shadowLight.position.set( 0, 60, 0 );
	shadowLight.target.position.set( 0, 0, 0 );
	shadowLight.castShadow = true;
	shadowLight.shadowCameraNear = 1;
	shadowLight.shadowCameraFar = 300;
	shadowLight.shadowCameraFov = 50;
	shadowLight.shadowBias = 0.0001;
	shadowLight.shadowDarkness = .4;
	shadowLight.shadowMapWidth = 2048;
	shadowLight.shadowMapHeight = 1024;
	scene.add(shadowLight);

	/**Just for temporary lamber models**/
	tempLight = new THREE.PointLight(0xAAAAAA);
	scene.add(tempLight);
	
	/**GUI**/
	gui = new dat.GUI();
	gui.add(guiResults, 'climateAppreciationValue').min(0).max(1).step(.1).onChange(guiSliderEvent);
	gui.add(guiResults, 'useRealTwitterData').onChange(guiTickEvent);

	//var binLoader = new THREE.BinaryLoader();
	var loader = new THREE.JSONLoader();
  
	/**Start loading objects**/
	
	//Cube
	loadIceCube();

	//World mesh
	loader.load( "objs/world/centerBuildings.js", function( geometry ) { createWorldMesh( geometry) }, "textures/GroundPlane" );
	function createWorldMesh( geometry ) {
		var worldMesh = new THREE.Mesh( geometry,  new THREE.MeshFaceMaterial());
		worldMesh.receiveShadow = true;
		scene.add(worldMesh);
	}

	//temporary lambert buildings
	loader.load( "objs/world/buildings.js", function( geometry ) { 
			var mat = new THREE.MeshFaceMaterial();		
			var msh = new THREE.Mesh( geometry,  mat);
			msh.receiveShadow = true;
			scene.add(msh);
		}
	);
	
	//glowing roof
	loader.load( "objs/world/glowingRoof.js", function( geometry ) { 
		var mat = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'textures/GroundPlane/centerBuilding.png' ) } );		
		glowingRoof = new THREE.Mesh( geometry,  mat);
		scene.add(glowingRoof);
	} , "textures/GroundPlane");

	//billboards
	loadBillboards();
	
	//both twitter planes
	new TwitterPlane(" ", function(twitPlane){
			happyPostFlag = twitPlane;
			scene.add(twitPlane);
			loadTextOnFlags();
		}
	);
	new TwitterPlane(" ", function(twitPlane){
			sadPostFlag = twitPlane;
			sadPostFlag.rotation.y = Math.PI;
			scene.add(twitPlane);
			loadTextOnFlags();
		}
	);

	//paths
	loadPaths();
	
	//4 clouds
	for(var i = 0; i < 4; ++i)
	{
		new Cloud(function(cloud){
				clouds.push(cloud);
				cloud.castShadow = true;
				scene.add(cloud);
			}
		);
	}

	/**Set up renderer**/
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor(new THREE.Color(0xb5d8ff), 1);
	renderer.setSize( container.offsetWidth || window.innerWidth, container.offsetHeight || window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.domElement.style.position = 'absolute';

	container.appendChild( renderer.domElement );

	//OPTIONAL - Stats
	//stats = new Stats();
	//stats.domElement.style.position = 'absolute';
	//stats.domElement.style.top = '0px';
	//container.appendChild( stats.domElement );
	
	/*Add callbacks**/
	document.addEventListener( 'mousemove' , onDocumentMouseMove, false );
	document.addEventListener( 'mousedown' , onDocumentMouseClick, false);
	document.addEventListener( 'mouseup' , onDocumentMouseUp, false);
	document.addEventListener( 'mousewheel' , onDocumentMouseWheel, false);
	window.addEventListener('resize', onWindowResize, false);

}

/**
 *	Called when slider is moved
 *	Turns off use real data flag and updates climate
 **/
function guiSliderEvent(){
	
	guiResults.useRealTwitterData = false;
	
	for (var i in gui.__controllers) {
		gui.__controllers[i].updateDisplay();
	};
	
	if(lastClimateAppreciationValue != guiResults.climateAppreciationValue)
	{
		setWorldClimate(guiResults.climateAppreciationValue);
		lastClimateAppreciationValue = guiResults.climateAppreciationValue;
	}
}

/**
 * 	Called when box is ticked
 *	Resets climate back to twitter value
 **/
function guiTickEvent(){

	if(guiResults.useRealTwitterData)
	{
		guiResults.climateAppreciationValue = twitterClimateAppreciationValue;
		
		setWorldClimate(guiResults.climateAppreciationValue);
	}
	
	for (var i in gui.__controllers) {
		gui.__controllers[i].updateDisplay();
	};	
}

/**
 *	Sets the climate on all the dependant objects
 *
 *	@param value - value to set (range 0 - 1)
 **/
function setWorldClimate(value){
		if(iceCube)
		{
			iceCube.scale.set(guiResults.climateAppreciationValue * iceCubeMaxScale,
							guiResults.climateAppreciationValue * iceCubeMaxScale,
							guiResults.climateAppreciationValue * iceCubeMaxScale);
		}
		for(var i = 0; i < clouds.length; ++i)
		{
			clouds[i].setClimate(guiResults.climateAppreciationValue);
		}	
};

/**
 *	Loads cube geometry and refraction map and adds
 *	it to the scene
 **/
function loadIceCube(){
	
	var loader = new THREE.JSONLoader();
			
	// set up refraction cube material samples
	var r = "textures/cubeMap/";
	var urls = [ r + "px.png", r + "nx.png",
				 r + "py.png", r + "ny.png",
				 r + "pz.png", r + "nz.png" ];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
	var diffMap = THREE.ImageUtils.loadTexture( 'textures/cubeMap/ice.png' );
	var cubeMat = new THREE.MeshBasicMaterial( { color: 0xccddff, envMap: textureCube, refractionRatio: 0.96, reflectivity:0, map: diffMap  } );
	
	//load with callback to add to scene
	loader.load( "objs/Cube/cube.js", function( geometry ) {
			iceCube = new THREE.Mesh( geometry,  cubeMat);
			scene.add(iceCube);
			iceCube.scale.set(iceCubeMaxScale,iceCubeMaxScale,iceCubeMaxScale);
			iceCube.material.color.r = 1.3;
			iceCube.material.color.g = 1.3;
			iceCube.material.color.b = 1.8;
		}
	);	
}

/**
 *	loads all the different paths, adds pedestrians
 *	to the paths when the paths load. Also adds pedestrians
 *	to the scene
 **/
function loadPaths(){
	/*Do pedestrians*/
	var onPathLoad = function(path){
		//paths.push(path);
		for(var i = 0; i < 8; ++i) //8
		{
			new Pedestrian(path, function(ped){
				pedestrians.push(ped);
				scene.add(ped);
			});
		
		
		}
	};

	for(var i = 0; i < 5; ++i) //5
	{				
		new Path("paths/pedestrian" + String(i+1) + ".pt", onPathLoad);
	}
		
	/*Do cars*/
	var onCarPathLoad = function(path){
		for(var i = 0; i < 10; ++i)
		{
			new Car(path, function(c){
				pedestrians.push(c);
				scene.add(c);
			});
		}
	};
	new Path("paths/car.pt", onCarPathLoad);
}


/** 
 *	Loads 4 billboards, sets their flags and adds them to the scene
 **/
function loadBillboards(){

	var binLoader = new THREE.JSONLoader();

	/** 1 **/
	binLoader.load( "objs/Billboards/triBillboard.js", function( geometry ) { 
		var mat = new AnimatedMaterial( { imageName: "textures/Billboards/Penguins/", numFrames:9, duration:2000 } );		
		billboards.push(new THREE.Mesh( geometry,  mat));
		billboards[billboards.length -1].alignToCamera = false;
		billboards[billboards.length -1].receiveShadow = true;
		scene.add(billboards[billboards.length - 1]);
	} );

	/** 2 **/
	binLoader.load( "objs/Billboards/triBillboard.js", function( geometry ) { 
		var mat = new AnimatedMaterial( { imageName: "textures/Billboards/Penguins/", numFrames:9, duration:2500 } );		
		billboards.push(new THREE.Mesh( geometry,  mat));
		billboards[billboards.length -1].alignToCamera = false;
		billboards[billboards.length -1].receiveShadow = true;
		billboards[billboards.length -1].rotation.y = Math.PI;
		scene.add(billboards[billboards.length - 1]);
	} );
	
	/** 3 **/
	binLoader.load( "objs/Billboards/steamBillboard.js", function( geometry ) { 
		var mat = new AnimatedMaterial( { imageName: "textures/Billboards/Steam/", numFrames:3, duration:3000} );	
		mat.transparent = true;	
		mat.opacity= 0.8;
		billboards.push(new THREE.Mesh( geometry,  mat));
		billboards[billboards.length - 1].position = new THREE.Vector3(-2.43,6.02,-13.57);
		billboards[billboards.length -1].alignToCamera = true;
		billboards[billboards.length -1].receiveShadow = true;
		scene.add(billboards[billboards.length - 1]);
	} );
	
	/** 4 **/
	binLoader.load( "objs/Billboards/steamBillboard.js", function( geometry ) { 
		var mat = new AnimatedMaterial( { imageName: "textures/Billboards/Steam/", numFrames:3, duration:2500} );	
		mat.transparent = true;	
		mat.opacity = 0.8;
		billboards.push(new THREE.Mesh( geometry,  mat));
		billboards[billboards.length - 1].position = new THREE.Vector3(-7.5,6.5,-13.50);
		billboards[billboards.length -1].alignToCamera = true;
		billboards[billboards.length -1].receiveShadow = true;
		scene.add(billboards[billboards.length - 1]);
	} );
	
}
	
/** Mouse Vars **/
var mouseStarted = false
var lastMouseX = 0;
var lastMouseY = 0;
var lastMouseMoveEventTime = new Date().getTime();
var leftClick = false;
var middleClick = false;
var personPicked = false;
var mouseOnDown = {"x":0,"y":0};

/**
 *	Called on mouse move
 *	handles spinning, panning
 **/
function onDocumentMouseMove( event ) {
	var deltaX = event.clientX - lastMouseX;
	var deltaY = event.clientY - lastMouseY;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;

	//if we're doing anything, calculate vectors
	if(leftClick || middleClick || personPicked)
	{
		if(!mouseStarted)
		{
			mouseStarted = true;
			lastMouseX = event.clientX;
			lastMouseY = event.clientY;
		}

		var mouseVec = new THREE.Vector3();
		mouseVec.z = deltaY;
		mouseVec.x = -deltaX;
	}

	//do spin by setting camera's angular velocity
	if(leftClick)
	{	
		/*todo: is this needed?*/
		var time = new Date().getTime();
		var timeDelta = time - lastMouseMoveEventTime;
		lastMouseMoveEventTime = time;
					
	}
	else if(middleClick && !personPicked) //disable camera movement when person is picked
	{
		mouseVec = mouseVec.normalize();
		camera.pan(mouseVec);
	}
}

/**
 *	Handles zoom on mouse wheel event
 **/
function onDocumentMouseWheel(event)
{
	camera.zoom(event.wheelDelta);
}

/**
 * Handles mouse click flags and person picking
 **/
function onDocumentMouseClick(event)
{
	//left button
	if(event.button == 0)
	{	
		//reset other person picked
		//personPicked = false;					
		if(pickedPedestrian != null)
		{
			pickedPedestrian.unsetPicked();
			pickedPedestrian = null;
		}
		else
		{
			checkPedestrianPick(event.clientX, event.clientY);
		}


		leftClick = true;	

   		
		camera.mouseDown(event.clientX);
	}
	
	//middle button
	if(event.button == 1)
		middleClick = true;
}

/**
 * Resets mouse flags and decreses camera dampening
 **/
function onDocumentMouseUp(event)
{
	camera.mouseUp();
	leftClick = false;	
	middleClick = false;
}

/**
 * Handles the user scaling the viewport
 **/
function onWindowResize( event )
{
	renderer.setSize( window.innerWidth, window.innerHeight );
	//use camera zoom function with 0 delta to update camera matrix
	camera.zoom(0);
}

/**
 *	Main 'game' loop. Updates everything, calculates delta and elapsed times
 **/
function animate() {
	//integer with time im milleseconds
	var currentTime = new Date().getTime();
	var delta = (currentTime - lastTime) * 0.001; //delta seconds
	lastTime = currentTime;

	updateIceCube(currentTime, delta);
	updateGlowingRoof(currentTime);
	updateBillboards(currentTime);
	updatePedestrians(currentTime, delta);
	updateClouds(currentTime, delta);
	updateTwitterStuff(currentTime);

	camera.update(currentTime, delta, lastMouseX);
	
	//move temp light to be at the eye pos
	tempLight.position = camera.position;
	
	renderer.render( scene, camera );
	//stats.update();
	
	//ask to do loop again
	requestAnimationFrame( animate );
}

//static vars for post reads
var lastPostReadTime = new Date().getTime();
var lastTotalSad = 0;
var lastTotalHappy = 0;

/**
 * Updates flags and reads the JSON file that contains
 * data about the twitter posts, if there are changes
 * to the file from the PHP script on the server, these
 * changes are seen in the game.
 *
 * It also sends a HTTP request for the php script,
 * this has the effect of running it on the sever, which
 * gathers twitter data
 *
 * @params currentTime - elapsed time in ms
 **/
function updateTwitterStuff(currentTime){
	
	//if the flags exist, update them
	if( happyPostFlag) happyPostFlag.update(currentTime);
	if( sadPostFlag) sadPostFlag.update(currentTime);
	
	//more than three seconds have passed
	if(currentTime - lastPostReadTime > 5000)
	{
		//now reset the time now that we can write the image
		lastPostReadTime = currentTime;
		
		loadTextOnFlags();
	}
}

function loadTextOnFlags(){
//create function to perform when file is loaded
		var callbackJSONLoad  = function(obj) { 
			//if a change is detected and the flags exist
			//then update the text
			if(lastTotalSad != obj.allTimeNumSad)
			{
				if(happyPostFlag) 
				{
					lastTotalSad = obj.allTimeNumSad;
					happyPostFlag.updateText(obj.currentSadText);
				}
			}
		
			if(lastTotalHappy != obj.allTimeNumHappy)
			{
				if(sadPostFlag) 
				{
					lastTotalHappy = obj.allTimeNumHappy;
					sadPostFlag.updateText(obj.currentHappyText);
				}
			}

			//if were are supposed to be using the real data, update the climate if there is a change
			if(guiResults.useRealTwitterData && obj.currentAverage != twitterClimateAppreciationValue)
			{
				twitterClimateAppreciationValue = obj.currentAverage;
				setWorldClimate(twitterClimateAppreciationValue);
				
				//simulate someone pressing the check button, as this has the effect
				//of showing the twitter climate value on the GUI slider
				guiTickEvent();
			}
		}
		
		var callbackTwitter = function(str){
			console.log(str);
			//read JSON file, using the callback if its successful
			new JSONReader("src/php/happySad.txt", callbackJSONLoad);
		}
		
		//get php script to run on server, then call callback for reasing JSON file
		new FileReader("src/php/twitter.php", callbackTwitter);	
}

/**
 * Spins the cube if it exists
 **/
function updateIceCube(currentTime, delta){
	if(iceCube)
	{
		iceCube.rotation.x += delta * .7;
		iceCube.rotation.z += delta * .4;
		iceCube.position.y = 15 + Math.sin(currentTime / 500) * 2;	
	}
}

/**
 * Makes the roof pulsate if it exists
 **/
function updateGlowingRoof(currentTime){
	if(glowingRoof)
	{
		var sinVal = Math.sin(currentTime / 270) * .5;
		sinVal += 1.5;

		glowingRoof.material.color.r = sinVal
		glowingRoof.material.color.g = sinVal;
		glowingRoof.material.color.b = sinVal;	
	}
}

/**
 * Update pedestrians, and if on is picked, use lastMouseX, and lastMouseY
 * to get the pick ray for movement
 **/
function updatePedestrians(currentTime, delta) {

	//if a pedestiran is picked up, set its position with the camera ray
	if(pickedPedestrian != null)
	{
		pickedPedestrian.position = camera.getLinePlaneIntersection(lastMouseX, lastMouseY);
	}
	
	for(var i = 0; i < pedestrians.length; ++i)
	{
		//returns true to delete
		if(pedestrians[i].update(currentTime, delta))
		{
			scene.remove(pedestrians[i]);
			pedestrians.splice(i, 1);
			--i;
		}
	}

}

/**
 * Updates the clouds, passes in camera zoom value so that they
 * can go transparent
 **/
function updateClouds(currentTime, delta){

	for(var i = 0; i < clouds.length; ++i)
	{
		clouds[i].update(currentTime, delta, camera.orthoSize);
	}
	
}

/**
 * update billboards and aligns them to the camera
 * if that particular flag is set
 **/
function updateBillboards(currentTime){

	for(var i = 0; i < billboards.length; ++i)
	{
		if(billboards[i].alignToCamera)
		{
			billboards[i].rotation.y = camera.cameraRotation;
		}
		billboards[i].material.update(currentTime);
	}
}


/**
 * Called from mouse down function
 * tries to pick a pedestrian and adds it
 * to pickedPedestrian variable if a pick 
 * was successful
 **/
function checkPedestrianPick(mouseX, mouseY){

	var pickResult = camera.getPickRay(mouseX, mouseY);
	var raySource = pickResult["src"];
	var ray = pickResult["vector"];
	
	for(var i = 0; i < pedestrians.length; ++i)
	{
		var pos = pedestrians[i].position.clone();
		//subtract ray origin
		pos.subSelf(raySource);
		
		if(pos.crossSelf(ray).length() < .6)
		{
			pedestrians[i].setPicked();
			pickedPedestrian = pedestrians[i];
			//personPicked = true;
			break;
		}
	}
}