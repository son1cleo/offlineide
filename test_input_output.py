#!/usr/bin/env python3
"""
Test to verify what Python's input() actually outputs to stdout
Run this locally to see the exact output pattern
"""

# This is what users will see when running input()
print("Before input")
name = input("What is your name? ")
print(f"After input, got: {name}")
