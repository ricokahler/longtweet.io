import { useEffect } from 'react';

interface Props {
  to: string;
}

function Redirect({ to }: Props) {
  useEffect(() => {
    window.location.assign(to);
  }, [to]);

  return null;
}

export default Redirect;
