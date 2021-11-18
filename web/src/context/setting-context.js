import { createContext, useContext, useState } from "react";

const defaultSetting = {
  sound: true,
  toggleSound: () => {},
  darkMode: true,
  toggleDarkMode: () => {},
};

const SettingContext = createContext(defaultSetting);

export function SettingProvider({ children }) {
  const [setting, setSetting] = useState(defaultSetting);

  function toggleSound() {
    setSetting((state) => ({ ...state, sound: !state.sound }));
  }

  function toggleDarkMode() {
    setSetting((state) => ({ ...state, darkMode: !state.darkMode }));
  }

  return (
    <SettingContext.Provider
      value={{
        sound: setting.sound,
        toggleSound,
        darkMode: setting.darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </SettingContext.Provider>
  );
}

export default function useSetting() {
  const ctx = useContext(SettingContext);
  return ctx;
}