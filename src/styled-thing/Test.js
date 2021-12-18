// import React, { useState } from 'react';
// import { AppRegistry, Text, View } from 'react-native';
// import { TouchableOpacity } from 'react-native-gesture-handler';
// import SplashScreen from 'react-native-splash-screen';
// import { MainThemeProvider } from '../context/ThemeContext';
// import styled from './';

// SplashScreen.hide();

// const Container = styled(View).attrs(({ useDark }) => ({
//   isDarkMode: useDark,
// }))({
//   alignItems: 'center',
//   backgroundColor: ({ isDarkMode }) => (isDarkMode ? 'black' : 'white'),
//   flex: 1,
//   justifyContent: 'center',
// });

// const Box = styled(View)(({ big }) => ({
//   backgroundColor: 'white',
//   height: big ? 100 : 50,
//   width: big ? 100 : 50,
// }));

// const RedBox = styled(Box)({
//   backgroundColor: ({ theme }) => theme.colors.pink,
// });

// const StyledButton = styled(TouchableOpacity)({
//   alignItems: 'center',
//   backgroundColor: 'red',
//   height: 60,
//   justifyContent: 'center',
//   width: 180,
// });

// const ButtonText = styled(Text)({
//   color: 'white',
// });

// export default function App() {
//   const [, forceUpdate] = useState(0);
//   function onPress() {
//     forceUpdate(v => v + 1);
//   }

//   return (
//     <MainThemeProvider>
//       <Container useDark>
//         <Box big />
//         <Box />
//         <RedBox big />
//         <StyledButton onPress={onPress}>
//           <ButtonText>Rerender</ButtonText>
//         </StyledButton>
//       </Container>
//     </MainThemeProvider>
//   );
// }

// // AppRegistry.registerComponent('Rainbow', () => App);
