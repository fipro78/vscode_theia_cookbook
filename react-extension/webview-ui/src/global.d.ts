import { VscodeLabel, VscodeTextfield } from "@vscode-elements/elements";

type ElementProps<I> = Partial<Omit<I, keyof HTMLElement>>;
type CustomEventHandler<E> = (e: E) => void;

type WebComponentProps<I extends HTMLElement> = React.DetailedHTMLProps<
  React.HTMLAttributes<I>,
  I
> &
  ElementProps<I>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "vscode-label": WebComponentProps<VscodeLabel>;
      "vscode-textfield": WebComponentProps<VscodeTextfield>;
    }
  }
}
