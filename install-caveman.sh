#!/bin/bash
mkdir -p ~/.claude/skills/caveman
git clone https://github.com/JuliusBrussee/caveman.git ~/Downloads/caveman-tmp
cp -r ~/Downloads/caveman-tmp/* ~/.claude/skills/caveman/
echo "Caveman skill installed! Restart Claude to activate."
