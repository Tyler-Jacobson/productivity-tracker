import { useState, useEffect } from "react"
import Cookies from 'universal-cookie';
import useSound from 'use-sound';
import clickSound from "../assets/click.mp3";
import alarmSound from "../assets/flute-alarm-2.mp3";

import "../App.css";

const cookies = new Cookies();

function format(num) {
    if (String(num).length === 1) {
        return "0" + String(num)
    } else {
        return num
    }
}

function timeConvert(num) { // in seconds
    let hours = Math.floor(num / 3600); 
    let remainder = num - (hours * 3600);
    let minutes = Math.floor(remainder / 60);
    let seconds = remainder - minutes * 60

  return format(hours) + ":" + format(minutes) + ":" + format(seconds);
}

const setCheckedDefaultValue = function() {
    if (cookies.get('addMinutePerDay') == null) {
        console.log("can't find minute per day cookie")
        console.log("setting checked to true")
        return true
    } else {
        console.log("addMinutePerDay cookie found, current cookie value is", cookies.get('addMinutePerDay'))
        var properBool = (cookies.get('addMinutePerDay') === 'true');
        console.log("setting checked to", properBool)
        return properBool
    }
}

const setCurrentTimeDefaultValue = function() {
    if (cookies.get('currentTime') != null) { return parseInt(cookies.get('currentTime')) } 
    else if (cookies.get('totalTime') != null) { return parseInt(cookies.get('totalTime')) } 
    
    else { 
        console.log("41")
        return 3600 
    }
}

const setTotalTimeDefaultValue = function() {
    if (cookies.get('totalTime') != null) { return parseInt(cookies.get('totalTime')) }
    else if (cookies.get('currentTime') != null) { return parseInt(cookies.get('currentTime')) }
    else { 
        console.log("52")
        return 3600 
    }
}


const Home = function() {

    const [ extended, setExtended ] = useState(false);
    const [ timerRunning, setTimerRunning ] = useState(false);
    const [ currentTime, setCurrentTime ] = useState(setCurrentTimeDefaultValue());
    const [ totalTime, setTotalTime ] = useState(setTotalTimeDefaultValue())
    const [ formValue, setFormValue ] = useState({ time: ""});
    const [ checked, setChecked ] = useState(setCheckedDefaultValue())

    const [play] = useSound(clickSound);
    const [alarm] = useSound(alarmSound);
    
    console.log(checked)


    const extend = function() {
        setExtended(!extended);
    }

    const startAndPause = function() {
        const date = new Date();
        const now = date.getTime();
        const nowSeconds = now / 1000
        play()
        console.log("flipped")
        setTimerRunning(!timerRunning)
    }

    const simpleUpdateCurrentTime = function(change) {
        const newTime = currentTime + change
        cookies.set('currentTime', newTime, { path: '/'})
        return setCurrentTime(newTime);
    }

    const simpleUpdateTotalTime = function(change) {
        const newTime = totalTime + change
        cookies.set('totalTime', newTime, { path: '/'})
        console.log("CHANGING TOTAL TIME TO:", newTime)
        return setTotalTime(newTime);
    }

    const handleChange = function(e) {
        setFormValue({
            ...formValue,
            [e.target.name]: e.target.value,
        });
    };

    const submitNewTime = function() {
        if (formValue.time === "") { return }
        if (formValue.time.includes(":")) {
            const splitTime = formValue.time.split(":")
            const hours = parseInt(splitTime[0]) * 3600
            const minutes = parseInt(splitTime[1]) * 60
            const newTimeSeconds = hours + minutes
            cookies.set('totalTime', newTimeSeconds, { path: '/'})
            cookies.set('currentTime', newTimeSeconds, { path: '/'})
            setCurrentTime(newTimeSeconds)
        } else {
            const intTime = parseInt(formValue.time)
            if (!Number.isNaN(intTime)) { 
                const newTimeSeconds = intTime * 60
                cookies.set('totalTime', newTimeSeconds, { path: '/'})
                cookies.set('currentTime', newTimeSeconds, { path: '/'})
                setCurrentTime(newTimeSeconds)
            }
        }
    }

    const clickCheckbox = function() {
        
        if (cookies.get('addMinutePerDay') == null) {
            console.log("no addMinutePerDay cookie found")
        }
        cookies.set('addMinutePerDay', !checked, { path: '/' });
        console.log('setting addMinutePerDay to', !checked);
        setChecked(!checked);
    }

    const displayTimeUntilBreak = function() {
        if (((totalTime - currentTime) % 1800) === 0) {
            return timeConvert(1500)
        } else if (currentTime < 1500 - ((totalTime - currentTime) % 1800)) {
            return "No More Breaks"
        } else if (((totalTime - currentTime) % 1800) < 1500) {
            return timeConvert(1500 - ((totalTime - currentTime) % 1800))
        } else {
            return "Break Time"
        }
    }

    const playSoundOnBreak = function() {
        console.log("Break Start", 1500 - ((totalTime - currentTime) % 1800))
        console.log("Current Time", currentTime)
        const breakCounter = 1500 - ((totalTime - currentTime) % 1800)
        console.log(breakCounter)
        if (breakCounter === 0 || breakCounter === -299) {
            alarm();
        }
    }

    useEffect(() => {

        const date = new Date();
        const now = date.getTime();
        const nowSeconds = now / 1000

        if (cookies.get('addMinutePerDay') == null) {
            cookies.set('addMinutePerDay', true, { path: '/' });   // if this was more than 22 hours ago, add 1 minute when the user clicks play, and reset time to total time
        }

        if (cookies.get('totalTime') == null) {
            console.log("no totalTime cookie found")
            cookies.set('totalTime', currentTime, { path: '/' });
        }



        if (cookies.get('currentTime') == null) {
            console.log("no currentTime cookie found 147")
            cookies.set('currentTime', 3600, { path: '/'})
        }


        if (cookies.get('lastLoginTime') == null) {
            console.log("no lastLoginTime cookie found")
            cookies.set('lastLoginTime', nowSeconds, { path: '/' });   // if this was more than 22 hours ago, add 1 minute when the user clicks play, and reset time to total time
            setCurrentTime(totalTime)
        }

        // may want to move this section to on-click
        if (cookies.get('lastLoginTime') < nowSeconds - 3600) { //seconds in a day 86400
            console.log("It's now the next day, reset to total time", cookies.get('lastLoginTime'), nowSeconds)
            console.log("the value of checked is", checked)
            if (checked) {
                simpleUpdateTotalTime(60) 
                simpleUpdateCurrentTime(60)
            }
            console.log(currentTime)
            console.log(totalTime)
            setCurrentTime(totalTime)
        }
        console.log("setting last login time to now")
        cookies.set('lastLoginTime', nowSeconds, { path: '/' }); // need to do this no matter what, but has to be done after the above check
        
        // section to possibly move ends here

    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            if (timerRunning) {
                console.log('This will run every second!', currentTime);
                simpleUpdateCurrentTime(-1);
                playSoundOnBreak();
            }
          }, 1000);
          return () => clearInterval(interval);
    })

    return (
        <div className="home-screen-box">
            <div className="center-content-container">
                <div className="center-circle">
                    <div className="center-button-container" onClick={startAndPause}>
                        <div className={timerRunning ? "inner-pause-segment" : "inner-triangle"}/>
                        <div className={timerRunning ? "inner-pause-segment" : "hidden-play-segment"}/>
                    </div>
                </div>
                <div className="time-text-container">
                    {/* (parseInt(totalTime - currentTime) % 1800) > 1500 ? timeConvert((currentTime % 1800) - 300) : "Break Time " + (totalTime - currentTime) % 1800 */}
                    {/* parseInt(totalTime - currentTime) % 1800 + " is not greater than 1500" */}
                    <p>until break: {displayTimeUntilBreak()} </p>
                    <p>total remaining: {currentTime > 0 ? timeConvert(currentTime) : "Time's Up!"}</p>
                </div>
            </div>
            <div className="foldout-section-container">
                <div className="foldout-section-padding" onClick={extend}>
                    <div className="foldout-section-padding-inner" />
                </div>
                <div className="foldout-section-button" onClick={extend} >
                    <div className="foldout-section-button-inner">
                        <div className={extended ? "chevron-right" : "chevron-left"}/>
                        <div className={extended ? "chevron-inner-right" : "chevron-inner-left"}/>
                    </div>
                </div>
                
                <div className={extended ? "foldout-section": "foldout-section hidden"}>
                    <div className="foldout-segment">
                        <p>add minute</p>
                        <img onClick={() => {simpleUpdateCurrentTime(60); simpleUpdateTotalTime(60);}} alt="click to add one minute" />
                    </div>
                    <div className="foldout-segment">
                        <p>remove minute</p>
                        <img onClick={() => {simpleUpdateCurrentTime(-60); simpleUpdateTotalTime(-60);}} alt="click to remove one minute" />
                    </div>
                    <div className="foldout-segment">
                        <p>set total time</p>
                        <input type="text" name="time" onChange={handleChange} />
                        <img onClick={submitNewTime} alt="submit new time"/>
                    </div>
                    <div className="foldout-segment">
                        <p>add one minute per day</p>
                        <input type="checkbox" onClick={clickCheckbox} checked={checked} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home