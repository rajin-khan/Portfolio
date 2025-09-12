---
title: "You Need to Use the CLI."
description: "Crack your knuckles and lock in."
date: 2025-09-12
tags:
  - CLI
  - Productivity
  - Developer Skills
image: "/assets/images/posts/cli.png"
---

![Command Window](/assets/images/posts/cli.png)

## So, what is the Command Line?  

The **Command Line Interface (CLI)** is a way to interact with your computer by typing commands instead of using a mouse. It allows you to move through files & folders **quickly**, run **powerful tools**, **automate** repetitive tasks, and just **control** your system **like a pro**. 

Or put simply, the CLI lets you **talk directly to your computer**, no clicking around, no waiting on apps. It’s **faster**, **more powerful**, and **more direct**.

If you've ever watched shows like **Mr. Robot**, or movies like **The Matrix**, you’ve probably seen characters flying through black terminals full of green text. That’s the CLI, and trust me, using it IRL is even cooler.

**But where is the CLI on your computer?** 🤔 Let’s find out!  

---

## Where to Find the Command Line:  

### 💻 **macOS (Terminal)**  

- Press **Cmd + Space** to open **Spotlight Search**.
- Type **"Terminal"** and press **Enter**.  

And that’s it! Now you have a command line where you can start typing commands.

<div class="video-container">
  <video width="100%" poster="/assets/images/posts/cli.png" autoplay loop muted>
    <source src="/assets/videos/posts/cli1.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

> I'm using an application called iTerm. Your Terminal Application may look different, but that's alright! We'll customize it soon!

---

### 🖥️ **Windows (CMD, PowerShell, or WSL)**  

Windows has **multiple** command-line options:  

- **Command Prompt (CMD)** – The built-in Windows CLI.  
*Press **Win + R**, type **"cmd"**, and press **Enter***.  

- **PowerShell** – A more advanced CLI with extra features.  
*Right-click the **Start Menu** → Select **Windows PowerShell***.  

- **Windows Subsystem for Linux (WSL)** -  
*This lets you use a real **Linux shell** on Windows. Install it with:*

   ```powershell
   wsl --install
   ```

![A screenshot of CMD](/assets/images/posts/cmd.png)
![A Screenshot of PowerShell](/assets/images/posts/pws.png)
![A screenshot of WSL](/assets/images/posts/wsl.png)

*I would **highly recommend** you install **WSL**. Many basic CLI commands mentioned here (and in most guides online) **may/may not work in CMD and PowerShell**, but **WSL** offers a unified environment that **emulates Unix based shells (like on Linux and Mac).***

*Images from [**programminghistorian**](https://programminghistorian.org/images/intro-to-powershell/intro-to-powershell1.png), [**Lifewire**](https://www.lifewire.com/thmb/Y0RbTq46ybpKnGzgWGiPiDdqgCE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/command-prompt-1fcee7b9a02c4fbbab3c526964476c97.png), and [**The Stack**](https://www.thestack.technology/windows-subsystem-for-linux-is-ga-for-windows-10-11-in-the-windows-store/), respectively.*

---

### ⚠️ Keep in mind, some Commands don't work on Windows.  
#### Why?

macOS and Linux use a **Unix-based shell** (like **Bash** or **Zsh**), while Windows uses **CMD or PowerShell**, which work **differently**.  

For example:  

*In **macOS/Linux**, list files with:*

  ```bash
  ls
  ```

*In **Windows CMD**, you must use:*

  ```cmd
  dir
  ```

**A reference list for the most common terminal commands across different platforms:**

| Task | macOS/Linux (Bash/Zsh) | Windows (CMD) | Windows (PowerShell) |
|------|----------------|---------------|----------------|
| List files | `ls` | `dir` | `Get-ChildItem` |
| Change directory | `cd folder` | `cd folder` | `cd folder` |
| Remove a file | `rm file.txt` | `del file.txt` | `Remove-Item file.txt` |

*As you'll see, **macOS and Linux** seem to have a unified shell environment (UNIX-based), which is generally the accepted standard in the developer community. It is recommended that you install **WSL (Windows Subsystem for Linux)** to get the same environment.*  

[*Link: Installing WSL on Windows*](https://docs.microsoft.com/en-us/windows/wsl/install)  

---

## Now that that's out of the way, why should you really use the CLI?

 
---

## 🏎️  The CLI Makes You Faster

Clicking through folders takes time. Instead, just type:  

```bash
cd ~/Documents
ls -la
```

#### See for yourself:

<div class="video-container">
  <video width="100%" poster="/assets/images/posts/cli.png" autoplay loop muted>
    <source src="/assets/videos/posts/cli2.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

<div class="video-container">
  <video id="myVideo" width="100%" poster="/assets/images/posts/cli.png" autoplay muted>
    <source src="/assets/videos/posts/cli3.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

<script>
const video = document.getElementById('myVideo');
const pauseDuration = 4050; // 2 seconds pause on last frame
let hasPlayedOnce = false;

video.addEventListener('ended', function() {
  if (!hasPlayedOnce) {
    // First time ending - pause on last frame
    hasPlayedOnce = true;
    setTimeout(() => {
      video.currentTime = 0;
      video.play();
    }, pauseDuration);
  } else {
    // Subsequent loops - loop immediately or with delay
    setTimeout(() => {
      video.currentTime = 0;
      video.play();
    }, pauseDuration);
  }
});
</script>

*Your hands stay on the keyboard. Your workflow becomes lightning fast. This is one of the main reasons **so many programmers prefer the CLI**. Speed and precision.*

---

## ⛓️‍💥  It Unlocks Powerful Tools 

Some of the best tools (that you may not even be aware of) **only work in the CLI**:  

- **`brew`** – The ultimate package manager. [*(What's a package manager?)*](https://www.debian.org/doc/manuals/aptitude/pr01s02.en.html)
<!-- (link to your mini blogpost when out, or external source, dont know what it is? find out?). -->
- **`grep`** – Find text inside files.  
- **`btop`** – Monitor your computer’s performance.  
- **`wget`** – Download files from the internet.  
- **`git`** – Manage your codebase and code versions.  
- **`df -h`** / **`du -sh`** – Check disk usage and monitor storage space.

Need to check how much space is left on your hard drive? Just type:

```bash
df -h
```

Or, monitor your current **download** and **upload** speeds:

```bash
networkquality -v
```

You can monitor your entire system from just one window:

<div class="video-container">
  <video id="myVideo" width="100%" poster="/assets/images/posts/cli.png" autoplay muted>
    <source src="/assets/videos/posts/cli4.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

*A beautiful system monitoring tool called **btop**, running in the terminal.*

***💡 **Tip:** If a process seems to keep running forever, press **Ctrl+C** at any point to quit the running program/process.***

---

## **🧑🏻‍💻 SSH – Remote Control Like a Pro**  

One of the coolest things the CLI lets you do is **SSH**. That stands for **Secure Shell**, and it allows you to connect to another computer (like a remote server, or even your PC) **from anywhere in the world**.

For example, you can log into your website’s server with:

```bash
ssh yourname@yourdomain.com (or your IP address)
```

From there, you can **run commands** on that computer **as if you were sitting in front of it**.

**SSH** is used for:

- **Hosting websites**  
- **Managing cloud servers (like AWS, DigitalOcean)**  
- **Secure file transfers**  
- **Remote development (VS Code is *really* useful for this)**

It's **like teleporting into another machine**, and it's a huge part of being a real power user.

<div class="video-container">
  <video width="100%" poster="/assets/images/posts/cli.png" autoplay loop muted>
    <source src="/assets/videos/posts/cli5.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

***A clip of me using **SSH** to remotely login to my home-server (a MacBook Pro) and view files and run commands from that machine's terminal remotely.***

*(Wanna know how SSH works? I'll post a blogpost and a full guide, soon!)*

---

## 💫  It Makes Actions Instant  

Want to rename 100 files at once? Instead of clicking manually:  

```bash
rename 's/old/new/' *.txt
```

CLI gives you **batch power** — change, move, delete, or organize hundreds of files in seconds.

## Okay, but how do we install these tools?

---

## 🍺  Installing CLI Tools with Homebrew  

On **macOS**, the best way to install CLI tools is **Homebrew**.  

![Screenshot of Homebrew.](/assets/images/posts/cli2.png) 

#### To Install Homebrew:

Open the **Terminal** and run:  

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

*Follow additional on-screen instructions to complete installation, it's super easy.*

[**Homebrew's Official Site**](https://brew.sh) 

## 🪟 What about Windows?  

On **Windows**, the best way to install CLI tools is **Scoop** or **Chocolatey**.  

![Screenshot of Scoop.](/assets/images/posts/scoop.png)

#### Install Scoop (Recommended):

Open **PowerShell** as **Administrator** and run:  

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb get.scoop.sh | iex
```

*Follow any additional on-screen instructions to complete the installation.*

[**Scoop's Official Site**](https://scoop.sh/) 

#### Install Chocolatey (Alternative):

![Screenshot of Scoop.](/assets/images/posts/choc.png)

Open **PowerShell** as **Administrator** and run:  

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

*As always, just follow any additional on-screen instructions to complete the installation.*

[**Chocolatey's Official Site**](https://chocolatey.org/) 

---

### Now, install some essential tools *(using brew, or any other package manager)*:  

```bash
brew install git
brew install btop # (or 'htop' if you want a simpler interface)
brew install tmux
brew install wget
```
*I'd really recommend **asking ChatGPT**, or any LLM **about your needs**, there's probably going to be a cool CLI tool for anything you can think of (whether it be **converting files**, **downloading YouTube videos**, or **VPNs**.).*

---

## 🧑🏻‍🏫  Essential CLI Commands  

Here’s a **cheat sheet** to get started:

| Command | What It Does |
|---------|------------|
| `pwd` | Shows current folder |
| `ls -lah` | Lists all files (including hidden ones) |
| `cd <folder>` | Opens a folder |
| `mkdir <folder>` | Creates a new folder |
| `rm -rf <folder>` | Deletes a folder ***(Be careful with this one!)*** |
| `cp <file> <destination>` | Copies a file |
| `mv <file> <destination>` | Moves a file |
| `cat <file>` | Views file content |
| `grep "text" <file>` | Searches for text inside a file |
| `find . -name "*.txt"` | Finds files by name |
| `chmod +x <file>` | Makes a file executable |
| `nano <file>` | Opens a text editor |
| `htop` | Monitors system performance |
| `df -h` | Shows storage usage |
| `ssh user@host` | Connect to remote computer |
| `git status` | Checks Git changes |
| `brew install <package>` | Installs software |
| `brew install --cask <package>` | Installs any app you want **(Spotify, Messenger, etc.)** |

[***A cheat sheet for UNIX CLI commands***](https://www.geeksforgeeks.org/linux-commands-cheat-sheet/)  
[***A cheat sheet for Windows PowerShell commands***](https://www.stationx.net/powershell-cheat-sheet/)  

---

## 🎬 Final Thoughts  

The CLI **isn’t just for developers**—it’s for **anyone** who wants to work faster and smarter. Start small, experiment, and soon you’ll wonder **how you ever lived without it!**

From **Mr. Robot style hacking** to **real-life productivity boosts**, the command line truly gives you superpowers and is both the first and final step in becoming a true power user.

💬 **What’s the first CLI command you learned? Drop it in the comments!**  