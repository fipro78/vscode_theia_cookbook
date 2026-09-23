# WSL Setup

This document describes a possible setup and configuration for a WSL on Windows that can be used to develop a Visual Studio Code Extension. The information is of course opinionated and can be adjusted on your personal needs.
The official documentation can be found in [How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)

- Open a Windows Terminal / Powershell
- Update the WSL installation

  ```powershell
  wsl --update
  ```

- Set the default to use WSL2
  ```powershell
  wsl --set-default-version 2
  ```
- Install Ubuntu 24.04 as WSL distribution
  ```powershell
  wsl --install -d Ubuntu-24.04
  ```
- Convert it to WSL2 (only if the distro was installed prior setting the default to 2)
  ```powershell
  wsl --set-version Ubuntu-24.04 2
  ```
- To set the installed distribution as new default distribution, use the following command

  ```powershell
  wsl -s Ubuntu-24.04
  ```

- Alternatively or additionally install Ubuntu 26.04 as WSL distribution
  ```powershell
  wsl --install -d Ubuntu-26.04
  ```

## Network configuration

If you run into networking issues when trying to access the internet from the WSL (e.g. DNS resolution when connected from home office via VPN), consider changing the network configuration.

- Option 1: Create and configure a WSL configuration file _C:\Users\\<userid\>\\.wslconfig_
  ```
  [wsl2]
  networkingMode = mirrored
  dnsTunneling = true
  ```
- Option 2: Open the `WSL Settings` via Windows Taskbar Search Field

Further information about WSL configurations can be found in [Advanced settings configuration in WSL](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)

## Share Environment Variables

It is possible to forward an environment variable from the Windows Host to the WSL. With this you don`t need to set the environment variable additionally in the WSL.

To forward an environment variable from the Windows Host to the WSL you can configure the special environment variable `WSLENV` in the Windows host system like this: `WSLENV=GITHUB_TOKEN/u`. Have a look at [Share Environment Vars between WSL and Windows](https://devblogs.microsoft.com/commandline/share-environment-vars-between-wsl-and-windows/) for further information.

## SSH configuration

If the repository can only be accessed via SSH and you want to work from within a remote container with the repository, you need to:

- Have the necessary SSH keys setup in the Windows host

- Make the SSH files from the Windows host accessible in the WSL, e.g. create a symbolic link in the WSL

  ```bash
  ln -s /mnt/c/Users/<userid>/.ssh ~/.ssh
  ```

  - In case of ssh error `Permissions 0755 for '/home/<userid>/.ssh/id_ed25519' are too open.`, change permissions

    ```
    chmod 600 ~/.ssh/id_ed25519
    ```

  - In case the permissions do not change in the mounted _.ssh_ folder, you need to perform the following steps to be able to change the permissions
    - For a temporary change, remount the C: drive as explained in [Chmod/Chown WSL Improvements](https://devblogs.microsoft.com/commandline/chmod-chown-wsl-improvements/)

    ```bash
    // unmount
    sudo umount /mnt/c

    // remount with metadata flag
    sudo mount -t drvfs C: /mnt/c -o metadata

    // change permissions with sudo
    sudo chmod 600 ~/.ssh/config
    sudo chmod 600 ~/.ssh/id_ed25519
    ```

    - If the change should be applied everytime the WSL distribution starts, edit the file _/etc/wsl.conf_ in the distribution and configure the `automount` options as described in [Automount settings](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#automount-settings) and [File Permissions for WSL](https://learn.microsoft.com/en-us/windows/wsl/file-permissions)

    ```ini
    [boot]
    systemd=true

    [user]
    default=<userid>

    [automount]
    options=metadata
    ```

- Activate the SSH agent if you want to do `git` operations from a devcontainer
  - On Windows open a Powershell as Administrator and execute the following statements
    ```powershell
    # Make sure you're running as an Administrator
    Set-Service ssh-agent -StartupType Automatic
    Start-Service ssh-agent
    Get-Service ssh-agent
    ```
  - On **Ubuntu 24.04** Linux (in the WSL)
    
    > For Ubuntu 26.04 have a look in the next section as the startup scripts are different

    - First, start the SSH Agent in the background by running the following in a terminal:

    ```bash
    eval "$(ssh-agent -s)"
    ```

    - Then add the following lines to the end of _~/.profile_ to start the `ssh-agent` automatically on login and to add the ssh keys via `ssh-add`

    ```bash
    if [ -z "$SSH_AUTH_SOCK" ]; then
      # Check for a currently running instance of the agent
      RUNNING_AGENT="`ps -ax | grep 'ssh-agent -s' | grep -v grep | wc -l | tr -d '[:space:]'`"
      if [ "$RUNNING_AGENT" = "0" ]; then
            # Launch a new instance of the agent
            ssh-agent -s &> $HOME/.ssh/ssh-agent
      fi
      eval `cat $HOME/.ssh/ssh-agent` > /dev/null
      ssh-add $HOME/.ssh/id_ed25519 2> /dev/null
      ssh-add $HOME/.ssh/id_rsa_github 2> /dev/null
    fi
    ```

  - On **Ubuntu 26.04** Linux (in the WSL)
    - First, create the necessary files for the process to work

    ```bash
    mkdir -p ~/.config && touch ~/.config/ssh-agent.pid
    ```

    - Then add the following lines to the end of _~/.profile_ to start the `ssh-agent` automatically on login and to add the ssh keys via `ssh-add`  
      (found this here [Automatically start a single instance of ssh-agent for all terminal sessions to share (bash)](https://gist.github.com/darrenpmeyer/e7ad217d929f87a7b7052b3282d1b24c) )

    ```bash
    # SSH agent
    ssh_pid_file="$HOME/.config/ssh-agent.pid"
    SSH_AUTH_SOCK="$HOME/.config/ssh-agent.sock"
    if [ -z "$SSH_AGENT_PID" ]
    then
      # no PID exported, try to get it from pidfile
      SSH_AGENT_PID=$(cat "$ssh_pid_file")
    fi

    if ! kill -0 $SSH_AGENT_PID &> /dev/null
    then
        # the agent is not running, start it
        rm "$SSH_AUTH_SOCK" &> /dev/null
        >&2 echo "Starting SSH agent, since it's not running; this can take a moment"
        eval "$(ssh-agent -s -a "$SSH_AUTH_SOCK")"
        echo "$SSH_AGENT_PID" > "$ssh_pid_file"
        ssh-add ~/.ssh/id_ed25519 2> /dev/null
        ssh-add ~/.ssh/id_rsa_github 2> /dev/null

        >&2 echo "Started ssh-agent with '$SSH_AUTH_SOCK'"
    # else
    # 	>&2 echo "ssh-agent on '$SSH_AUTH_SOCK' ($SSH_AGENT_PID)"
    fi
    export SSH_AGENT_PID
    export SSH_AUTH_SOCK
    ```

  - If you now restart the WSL (exit the WSL and either shutdown all WSL distributions via `wsl --shutdown` or terminate only the concrete instance via `wsl --terminate Ubuntu-24.04` if the distribution is installed with that name) the `ssh-agent` should be started and the ssh keys should be added automatically.

  - You can check which keys are added to the `ssh-agent` via `ssh-add -l`

- Add the following entry to _~/.ssh/config_ to enable ssh-agent forwarding to devcontainers started from the wsl

  ```
  Host *
      ForwardAgent yes
  ```

- The above steps are also described in
  - [Sharing Git credentials with your container - Using SSH keys](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials#_using-ssh-keys)
  - [Setting up the SSH Agent](https://code.visualstudio.com/docs/remote/troubleshooting#_setting-up-the-ssh-agent)

## Git configuration

Git is pre-installed in the Ubuntu WSL distributions. But you need to ensure that git is configured correctly with your username and email address as explained in [Sharing Git credentials with your container](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials).

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@address"
```

## Checkout sources

- Create folder in your home directory (e.g. _$HOME/\<userid\>/dev_)
  ```
  mkdir ~/dev
  ```
- checkout this project for example

  ```
  cd ~/dev
  git clone git@github.com:fipro78/vscode_theia_cookbook.git
  ```

If you want to commit from a Dev Container that is started from a WSL, there can be multiple pitfalls to take care of:

1. ssh keys  
   Ensure that a `ssh-agent` is started in the WSL and that the ssh keys are added (see above)

2. file permissions  
   If the user of your Dev Container is not root, you might need to change the file permission of the files in the repository, e.g. `sudo chmod -R 777 .`  
   If you do this you might need to also configure that file mode changes are not considered changes for git. This can be done via
   `   git config core.fileMode false`

3. _config_ file with with `IdentityFile` configurations
  If you have multiple GitHub accounts that you work with (e.g. a private and a company account), you might have a _config_ file that looks similar to the below snippet according to [Contributing to multiple accounts using SSH and multiple keys](https://docs.github.com/en/account-and-profile/how-tos/account-management/managing-multiple-accounts#contributing-to-multiple-accounts-using-ssh-and-multiple-keys)

  ```
  Host *
      ForwardAgent yes

  Host github.com-fipro78
      Hostname github.com
      IdentityFile ~/.ssh/id_rsa_github
      IdentitiesOnly yes

  Host github.com-dirkfauth
      Hostname github.com
      IdentityFile ~/.ssh/id_rsa_github_work
      IdentitiesOnly yes
  ```

  This works fine when you created the symbolic link to the _.ssh_ folder in the Windows host or you copied the files to the WSL. For the DevContainer it does not work, because the ssh key identity files are not available. In that case the only working solution is to mount the _.ssh_ folder of the WSL to the DevContainer. For this add for example the following setting into the _devcontainer.json_:

  ```json
  "mounts": ["source=${localEnv:HOME}/.ssh,target=/home/node/.ssh,type=bind"]
  ```

## Install Docker in the WSL

To install Docker in the WSL follow the steps described in the following section. These steps are also described in more detail here:

- [Install Docker on Windows (WSL) without Docker Desktop](https://dev.to/bowmanjd/install-docker-on-windows-wsl-without-docker-desktop-34m9)
- [Ubuntu - Docker Docs](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

- Install/udpate additional tools (curl, certificates)
  ```
  sudo apt update
  sudo apt install ca-certificates curl
  ```

1. Set up Dockers `apt` repository (WSL)

   ```bash
   # Add Docker's official GPG key:
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc

   # Add the repository to Apt sources:
   sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
   Types: deb
   URIs: https://download.docker.com/linux/ubuntu
   Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
   Components: stable
   Architectures: $(dpkg --print-architecture)
   Signed-By: /etc/apt/keyrings/docker.asc
   EOF

   sudo apt update
   ```

2. Install the latest Docker version (WSL)

   ```bash
   sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

- After installation, verify that Docker is running:

  ```bash
  sudo systemctl status docker
  ```

- If Docker is not running, start it manually:

  ```bash
  sudo systemctl start docker
  ```

- To be able to start `docker` without `sudo`, add your user to docker group (WSL)

  ```bash
  sudo usermod -aG docker $USER
  ```

- Restart the WSL (Windows)

  ```powershell
  wsl --shutdown
  ```

- Verify that you can use `docker` without `sudo` via

  ```bash
  docker run hello-world
  ```

- If you need to be able to access the Docker API, configure the remote access on Docker daemon as described in  
  [Configure remote access for Docker daemon](https://docs.docker.com/config/daemon/remote-access/)

## Optional: Additional development tool installations

In case it is planned to develop directly in the WSL instead of making use of Dev Containers, additional tools like a Java SDK, Maven or Node.js need to be installed and configured.

### Install Java in the WSL

If you want to develop with Java in the WSL, the easiest way to install Java is to use [SDKMAN!](https://sdkman.io/install/)

- Install the necessary prerequisites

  ```bash
  sudo apt install zip unzip
  ```

- Start the SDKMAN! installation

  ```bash
  curl -s "https://get.sdkman.io" | bash
  ```

- Start the SDKMAN! init

  ```bash
  source "$HOME/.sdkman/bin/sdkman-init.sh"
  ```

- Confirm the installation success

  ```bash
  sdk version
  ```

- Install Java, e.g. Temurin 25

  ```bash
  sdk install java 25.0.4-tem
  ```

  If you want to first list the available versions to identify which version you want to install:

  ```bash
  sdk list java
  ```

- Install Maven

  ```bash
  sdk install maven
  ```

- Exit, terminate and restart the WSL so the environment changes are applied on startup (e.g. environment variables)

### Install Node.js in the WSL

To install Node.js to the WSL you can use [NVM (Node Version Manager)](https://www.nvmnode.com/), which is a tool that allows you to easily install, manage, and work with multiple Node.js versions on your system.

- Use the installation script to download and install NVM, as described in [Download NVM](https://www.nvmnode.com/guide/download.html#nvm-for-linux-ubuntu-mac-nvm-sh)

  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  ```

- Exit, terminate and restart the WSL so the environment changes are applied on startup (e.g. environment variables)

- Check which versions are available

  ```bash
  nvm ls-remote
  ```

- Install for example the latest LTS

  ```bash
  nvm install --lts
  ```

If a Theia build is intended to be executed in the WSL, the additional tools need to be installed, like in the **postCreateCommand.sh** script in this repository:

https://github.com/fipro78/vscode_theia_cookbook/blob/51ba3357fba9eebace0c8beaa5f920d5ae9278c1/.devcontainer/postCreateCommand.sh#L3-L18

Also note that the `NODE_OPTIONS` environment variable probably needs to be set, as described in [Interlude: JavaScript heap out of memory](./theia_getting_started.md#interlude-javascript-heap-out-of-memory)

```bash
(echo ; echo "export NODE_OPTIONS=\"--max-old-space-size=8192\"") >> .bashrc
```
