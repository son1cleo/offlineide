#!/bin/bash
# Interactive Bash Example
# Tests stdin input with read command

echo "🐚 Bash Interactive Terminal Demo"
echo ""

# Read username
echo -n "Enter your username: "
read username
echo "Welcome, $username!"
echo ""

# Read favorite color
echo -n "What's your favorite color? "
read color
echo "Nice! $color is a beautiful color."
echo ""

# Simple menu
echo "Choose an option:"
echo "1) Option A"
echo "2) Option B"  
echo "3) Exit"
echo -n "Your choice: "
read choice

case $choice in
  1)
    echo "You selected Option A!"
    ;;
  2)
    echo "You selected Option B!"
    ;;
  3)
    echo "Goodbye!"
    ;;
  *)
    echo "Invalid option!"
    ;;
esac

echo ""
echo "✨ Interactive bash demo complete!"
