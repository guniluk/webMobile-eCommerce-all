import { Show, SignInButton, UserButton } from "@clerk/react";

const App = () => {
  return (
    <div>
      <h1>Home Page</h1>

      <Show when="signed-out">
        <SignInButton mode="modal" />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
};

export default App;
