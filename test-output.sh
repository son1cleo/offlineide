#!/bin/bash
# Test: Verify final output is captured in Bash

echo "Starting test..."
read -p "Enter first number: " num1
read -p "Enter second number: " num2
result=$(echo "$num1 + $num2" | bc 2>/dev/null || echo "$((num1 + num2))")
echo "Result: $num1 + $num2 = $result"
echo "Test complete - you should see this line!"
