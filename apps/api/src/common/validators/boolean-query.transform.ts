import { Transform } from 'class-transformer';

/** Query strings are strings: map "true"/"1" to true, everything else to false. */
export const BooleanQuery = () =>
  Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === true || raw === 'true' || raw === '1';
  });
