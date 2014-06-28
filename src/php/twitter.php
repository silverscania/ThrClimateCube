<?php

//scheduling:
//max search is 100 per hour, so just do 1 per 2 minutes (because both positive and negative searches are needed)

//read previous results into array
$fileString = file_get_contents("happySad.txt");
$fileArray = json_decode($fileString, $assoc = true);


//get yesterdays date
$date = getdate(time() - 24*60*60);

//check if one minute has passed
if($fileArray["lastSearchTime"] + 30 > time())
{
	echo "too soon";
}
else
{
	$fileArray["lastSearchTime"] = time();
		
	//check if we are on a new day, if so, clear the previous result arrays and set the date
	if($fileArray["currentSearchYear"] != $date[year] ||
		$fileArray["currentSearchMonth"] != $date[mon] ||
		$fileArray["currentSearchDay"] != $date[mday])
	{
		//clear previous IDs by setting to empty arrays
		$fileArray["previousHappyIDs"] = array();
		$fileArray["previousSadIDs"] = array();
		
		//set the date
		$fileArray["currentSearchYear"] = $date[year];
		$fileArray["currentSearchMonth"] = $date[mon];
		$fileArray["currentSearchDay"] = $date[mday];
		
	}
	
	
	//build happy string with yesterday as the 'since' date and do search
	$url = "http://search.twitter.com/search.json?q=%22climate%20change%22%20%3A)%20since%3A" . $date[year] . "-" . $date[mon] . "-". $date[mday] . "&rpp=50&result_type=mixed";
	
	//decode happy search result string into arrays
	$json = file_get_contents($url);
	//echo $json;
	$happyData = json_decode($json, $assoc = true );
	
	
	//build another string with yesterday as the 'since' date and do search, this time with a sad face
	$url = "http://search.twitter.com/search.json?q=%22climate%20change%22%20%3A(%20since%3A" . $date[year] . "-" . $date[mon] . "-". $date[mday] . "&rpp=50&result_type=mixed";
	
	//decode sad search result string into arrays
	$json = file_get_contents($url);
	$sadData = json_decode($json, $assoc = true );
	
	
	//get both search results from search data
	$happyResults = $happyData["results"];
	$sadResults = $sadData["results"];
	
	//if we find a happy or sad results, shift the moving average one place.
	//That way we have an up to date average. In comparison, if we shifted
	//every time the script is called (two minutes) and no posts were appearing,
	//the average would often tend to the ratio of sad/happy at the time of the last post.
	$postFound = false;
	$happyPostsFound = 0;
	$sadPostsFound = 0;
	
	//array of results is ordered newest [0] -> oldest [n...]
	
	//happy:
	//go through array from old to new until we find a new post
	for($i = sizeof($happyResults) - 1; $i >= 0; $i--)
	{
		//this post hasn't previously been seen
		if( !in_array($happyResults[$i]["id_str"], $fileArray["previousHappyIDs"]) ) 
		{
			//shift moving average
			$postFound = true;
			$happyPostsFound++;
			
			//add it to the previous IDs array
			array_push($fileArray["previousHappyIDs"], $happyResults[$i]["id_str"]);
			
			//set it as a new result
			$fileArray["currentHappyID"] = $happyResults[$i]["id_str"];
			$fileArray["currentHappyText"] = $happyResults[$i]["text"];
			
			$fileArray["allTimeNumHappy"]++;
			
			//for debug, dont fill up entire days results in one
			if($_GET["fillup"] == "n" )
			{
				//dont add any more now so we can see them pop up one by one
				//echo "breaking";
				break;
			}
		}
	}
	  
	//sad:
	//go through array from old to new until we find a new post
	for($i = sizeof($sadResults) - 1; $i >= 0; $i--)
	{
		//this post hasn't previously been seen
		if( !in_array($sadResults[$i]["id_str"], $fileArray["previousSadIDs"]) ) 
		{
			//set flag to shift average
			$postFound = true;
			$sadPostsFound++;
			
			//add it to the previous IDs array
			array_push($fileArray["previousSadIDs"], $sadResults[$i]["id_str"]);
			
			//set it as a new result
			$fileArray["currentSadID"] = $sadResults[$i]["id_str"];
			$fileArray["currentSadText"] = $sadResults[$i]["text"];
			
			$fileArray["allTimeNumSad"]++;
			
			//for debug, dont fill up entire days results in one
			if($_GET["fillup"] == "n" )
			{
				//dont add any more now so we can see them pop up one by one
				break;
			}
		}
	}
	
	if($postFound == true)
	{
		shift_average($fileArray, $happyPostsFound, $sadPostsFound);
	}
	
	//get array of results from the data and 
	//loop through each value
	/*
	foreach($data["results"] as &$value)
	{
		//print text
		echo $value["text"];
		echo "\n\n";
	}	
	*/
	
	/*Temp stuff to create empty file with array*/
	if($_GET["clear"] == "y")
	{
		clear_save_file($date);
	}
	else
	{
		/*or write proper data*/
		$tempData = json_encode($fileArray);
		file_put_contents("happySad.txt", $tempData);
		
		echo "done";
	}
}

function clear_save_file($date)
{
		//write results out to file
	$tempArry = array(
						"currentSearchYear" => $date[year], "currentSearchMonth" => $date[mon], "currentSearchDay" => $date[mday], 
						"allTimeNumHappy" => 0, "allTimeNumSad" => 0, 
						"previousHappyIDs" => array(), "currentHappyText" => " ", "currentHappyID" => "0",
						"previousSadIDs" => array(), "currentSadText" => " ", "currentSadID" => "0",
						"happyMovingAverageArray" => array(),
						"sadMovingAverageArray" => array(),
						"currentAverage" => 0
						);
						

	
	$tempData = json_encode($tempArry);
	file_put_contents("happySad.txt", $tempData);
}


/* takes the array of both happy and sad averages and removes the oldest result and 
 * places the new result at the front.
 *
 * also calculates the new average
 *
 */
function shift_average(&$fileArray, $happyPostsFound, $sadPostsFound)
{
	//make moving average work over the duration of 20 posts
	
	//while array is less than 20 posts, keep adding to end
	if(sizeof($fileArray["happyMovingAverageArray"]) <= 20)
	{
		array_push($fileArray["happyMovingAverageArray"], $happyPostsFound);
		array_push($fileArray["sadMovingAverageArray"], $sadPostsFound);
	}
	else //else pop the front first, then push
	{
		//clear first element
		unset($fileArray["happyMovingAverageArray"][0]);
		//reorder indices
		$fileArray["happyMovingAverageArray"] = array_values($fileArray["happyMovingAverageArray"]);
		//push new value onto end
		array_push($fileArray["happyMovingAverageArray"], $happyPostsFound);
		
		//same for sad
		//clear first element
		unset($fileArray["sadMovingAverageArray"][0]);
		//reorder indices
		$fileArray["sadMovingAverageArray"] = array_values($fileArray["sadMovingAverageArray"]);
		//push new value onto end
		array_push($fileArray["sadMovingAverageArray"], $sadPostsFound);
	}
	
	//now recalculate average
	//say 50% is neutral, 100% is all good, 0% is all negative
	
	//add up values
	$sadTotal = 0;
	$happyTotal = 0;
	foreach($fileArray["happyMovingAverageArray"] as $value)
	{
		$happyTotal += $value;
	}
	foreach($fileArray["sadMovingAverageArray"] as $value)
	{
		$sadTotal += $value;
	}
		
	
	//calculate average
	if($sadTotal == $happyTotal) //cant do divisions and stuff so return neutral value
	{
		$fileArray["currentAverage"] = 0.5;
	}
	elseif($happyTotal > $sadTotal)//result will be > 0.5
	{
		//make so if sad is 0, then its 100%, moving to 0% at sad = happy
		$average = $happyTotal - $sadTotal;
		
		//normalise 0 -> 0.5
		$average /= $happyTotal * 2;
		
		//add 0.5 to make .5 -> 1.0
		$fileArray["currentAverage"] = $average + 0.5;
	}
	elseif($sadTotal > $happyTotal) //result will be < 0.5
	{
		//make so if happy is 0, then its 100%, moving to 0% at sad = happy
		$average = $sadTotal - $happyTotal;
		
		//normalise 0.5 -> 0.0
		$average /= $sadTotal * 2;
		
		//sub from .5 to flip to make 0 -> 0.5
		$fileArray["currentAverage"] = .5 - $average;
	}
	
	
}
?>
