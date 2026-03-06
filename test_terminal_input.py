#!/usr/bin/env python3
"""
Terminal Input Test - Simple Interactive Program
Tests if stdin is properly connected
"""

print("=" * 50)
print("Terminal Input Test Starting")
print("=" * 50)
print()

# Test 1: Simple input
print("Test 1: Simple name input")
name = input("What is your name? ")
print(f"Hello, {name}!")
print()

# Test 2: Number operations
print("Test 2: Number operations")
num_str = input("Enter a number: ")
try:
    num = int(num_str)
    result = num * 2
    print(f"Double of {num} is {result}")
except ValueError:
    print(f"'{num_str}' is not a valid number")
print()

# Test 3: Confirmation
print("Test 3: Yes/No confirmation")
response = input("Do you like Python? (yes/no): ")
if response.lower() in ['yes', 'y']:
    print("Great! Python is awesome!")
elif response.lower() in ['no', 'n']:
    print("No worries, let's still have fun!")
else:
    print(f"You said: {response}")
print()

print("=" * 50)
print("All tests completed!")
print("=" * 50)
