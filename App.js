import React, { useEffect, useRef, useState } from 'react';
import {StyleSheet, View, Text, Button, PermissionsAndroid, AppState} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import DeviceInfo from 'react-native-device-info';


const App = () => {

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [location, setLocation] = useState(false);

  /**
   * Ask for permission over location
   * @returns boolean True if persmission is ok or false if does not have permission
   */
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geolocation Permission',
          message: 'We need to collect some data for improve your experience',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      console.log('granted', granted);
      if (granted === 'granted') {
        console.log('You can use Geolocation');
        return true;
      } else {
        console.log('You cannot use Geolocation');
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  const getLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      console.log('res is:', res);
      if (res) {
        Geolocation.getCurrentPosition(
          position => {
            console.log(position);
            setLocation(position);
          },
          error => {
            console.log(error.code, error.message);
            setLocation(false);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      }
    });
    console.log(location);
  };

  const watchLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      console.log('res is:', res);
      if (res) {
        Geolocation.watchPosition(
          async position => {
            console.log(position);
            setLocation(position);
            const idDevice = await DeviceInfo.getUniqueId();
            try {
              const response = await fetch('http://beaa-190-250-68-157.ngrok.io/api/location', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  user: idDevice,
                  geolocation: {
                    latitude: `${position.coords.latitude}`,
                    longitude: `${position.coords.longitude}`
                  }
                })
              });
              const json = await response.json();
              console.log('aja: ', json)
            } catch (error) {
              console.error(error);
            }
          },
          error => {
            console.log(error.code, error.message);
            setLocation(false);
          },
          {enableHighAccuracy: true, interval: 5000, distanceFilter: 5},
        );
      }
    });
    console.log(location);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
      } else {
        console.log("Background!!!");
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log("AppState", appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Geolocation App</Text>
      <View
        style={styles.button}>
        <Button onPress={watchLocation} title="Watch Location" />
      </View>
      <Text>Latitude: {location ? location.coords.latitude : 'N/A'} </Text>
      <Text>Longitude: {location ? location.coords.longitude : 'N/A'} </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'gray',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 10, 
    padding: 10, 
    borderRadius: 10, 
    width: '40%'
  }
});

export default App;