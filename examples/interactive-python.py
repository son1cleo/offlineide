# Interactive Python Example
# Tests stdin input with the interactive terminal

print("Welcome to the interactive terminal!")
print("This demonstrates real-time stdin/stdout support.\n")

# Get user name
name = input("What is your name? ")
print(f"Hello, {name}! Nice to meet you.\n")

# Get age
age = input("How old are you? ")
print(f"You are {age} years old.\n")

# Simple calculation
num1 = input("Enter first number: ")
num2 = input("Enter second number: ")

try:
    result = float(num1) + float(num2)
    print(f"\n{num1} + {num2} = {result}")
except ValueError:
    print("\nError: Please enter valid numbers!")

print("\n✨ Interactive demo complete!")
