import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Loading } from '@/components/ui';
import { getRefCode, setRefCode } from '@/store';

// atlas://r/CODE opens the app and remembers who invited this person
// (the first code wins, like on the website).
export default function InviteLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    (async () => {
      if (!(await getRefCode()) && code) await setRefCode(code);
      setDone(true);
    })();
  }, [code]);
  return done ? <Redirect href="/" /> : <Loading />;
}
