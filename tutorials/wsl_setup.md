# WSL Setup

This document describes a possible setup and configuration for a WSL on Windows that can be used to develop a Visual Studio Code Extension. The information is of course opinionated and can be adjusted on your personal needs.
The official documentation can be found in [How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)

- Open a Windows Terminal / Powershell
- Update the WSL installation

  ```
  wsl --update
  ```

- Set the default to use WSL2
  ```
  wsl --set-default-version 2
  ```
- Install Ubuntu 22.04 as wsl
  ```
  wsl --install -d Ubuntu-22.04
  ```
- Convert it to WSL2 (only if the distro was installed prior setting the default to 2)
  ```
  wsl --set-version Ubuntu-22.04 2
  ```

### Network configuration

If you run into networking issues when trying to access the internet from the WSL (e.g. DNS resolution when connected from home office via VPN), consider changing the network configuration.

- Option 1: Create and configure a WSL configuration file _C:\Users\\<userid\>\\.wslconfig_
  ```
  [wsl2]
  networkingMode = mirrored
  dnsTunneling = true
  ```
- Option 2: Open the `WSL Settings` via Windows Taskbar Search Field

Further information about WSL configurations can be found in [Advanced settings configuration in WSL](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)

### SSH configuration

If the repository can only be accessed via SSH and you want to work from within a remote container with the repository, you need to:

- Have the necessary SSH keys setup in the Windows host

- Make the SSH files from the Windows host accessible in the WSL, e.g. create a symbolic link

  ```
  ln -s /mnt/c/Users/<userid>/.ssh ~/.ssh
  ```

  - in case of ssh error `Permissions 0755 for '/home/<userid>/.ssh/id_ed25519' are too open.`, change permissions

  ```
  chmod 600 ~/.ssh/id_ed25519
  ```

- Activate the SSH agent if you want to do `git` operations from a devcontainer

  - On Windows open a Powershell as Administrator and execute the following statements
    ```shell
    # Make sure you're running as an Administrator
    Set-Service ssh-agent -StartupType Automatic
    Start-Service ssh-agent
    Get-Service ssh-agent
    ```
  - On Linux (in the WSL) add the following lines to the end of _~/.bashrc_

    ```shell
    if [ -z "$SSH_AUTH_SOCK" ]; then
      # Check for a currently running instance of the agent
      RUNNING_AGENT="`ps -ax | grep 'ssh-agent -s' | grep -v grep | wc -l | tr -d '[:space:]'`"
      if [ "$RUNNING_AGENT" = "0" ]; then
            # Launch a new instance of the agent
            ssh-agent -s &> $HOME/.ssh/ssh-agent
      fi
      eval `cat $HOME/.ssh/ssh-agent`
    fi
    ```

  - If you want that the changes are taken over without a restart, call `source ~/.bashrc`

  - Add your ssh keys via

    ```
    ssh-add ~/.ssh/id_ed25519
    ```

  - When a new instance of the `ssh-agent` is started, it looses the added keys. In that case it might make sense to add the `ssh-add` commands also to the _.bashrc_
    ```shell
    if [ -z "$SSH_AUTH_SOCK" ]; then
      # Check for a currently running instance of the agent
      RUNNING_AGENT="`ps -ax | grep 'ssh-agent -s' | grep -v grep | wc -l | tr -d '[:space:]'`"
      if [ "$RUNNING_AGENT" = "0" ]; then
            # Launch a new instance of the agent
            ssh-agent -s &> $HOME/.ssh/ssh-agent
      fi
      eval `cat $HOME/.ssh/ssh-agent`
      ssh-add ~/.ssh/id_ed25519
      ssh-add ~/.ssh/id_rsa_github
    fi
    ```
    - You can check which keys are added to the ssh-agent via `ssh-add -l`

- Add the following entry to _~/.ssh/config_ to enable ssh-agent forwarding to devcontainers started from the wsl

  ```
  Host *
      ForwardAgent yes
  ```

- The above steps are also described in
  - [Sharing Git credentials with your container - Using SSH keys](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials#_using-ssh-keys)
  - [Setting up the SSH Agent](https://code.visualstudio.com/docs/remote/troubleshooting#_setting-up-the-ssh-agent)

### Checkout sources

- Create folder in your home directory (e.g. _/home/\<userid\>/dev_)
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

### Install Docker in the WSL

- Install additional tools (curl, certificates, gnupg, git)
  ```
  sudo apt-get install -y apt-transport-https ca-certificates curl gnupg git lsb-release
  ```
- Install Docker
  - [Install Docker on Windows (WSL) without Docker Desktop](https://dev.to/bowmanjd/install-docker-on-windows-wsl-without-docker-desktop-34m9)
  - [Ubuntu - Docker Docs](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

1. Set up Dockers `apt` repository (WSL)

   ```shell
   # Add Docker's official GPG key:
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
     sudo chmod a+r /etc/apt/keyrings/docker.gpg

   # Add the repository to Apt sources:
   echo \
     "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get -y update
   ```

2. Install the latest Docker version (WSL)
   ```
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

- Add user to docker group (WSL)
  ```
  sudo usermod -aG docker $USER
  ```
- Restart the WSL (Windows)
  ```
  wsl --shutdown
  ```
- Configure remote access on Docker deamon to be able to access the Docker API  
   [Configure remote access for Docker daemon](https://docs.docker.com/config/daemon/remote-access/)