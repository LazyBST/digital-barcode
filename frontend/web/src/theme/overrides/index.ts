import { Theme } from '@mui/system';
import Radiobutton from './Radiobutton';
import Checkbox from './Checkbox';
import Button from './Button';
import Link from './Link';
import TextField from './TextField';

const componentsOverride = (theme: Theme) =>
  Object.assign(
    Button(theme),
    Link(),
    Radiobutton(theme),
    Checkbox(theme),
    TextField(theme),
  );

export default componentsOverride;
