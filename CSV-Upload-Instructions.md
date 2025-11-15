# CSV Upload Instructions for LearnAura

## How to Upload a Class via CSV

1. **Click "Upload CSV" button** in the Create Class page
2. **Enter a class name** when prompted (e.g., "Grade 5 Mathematics 2024")
3. **Select your CSV file** from your computer
4. The system will automatically import all students with their parent email addresses

## CSV File Format

Your CSV file should have the following structure:

```csv
Name,Parent Email,2nd Parent Email
John Doe,parent@email.com,parent2@email.com
Jane Smith,jane.parent@email.com,
```

### Column Details:
- **Column 1 (Required)**: Student Name
- **Column 2 (Optional)**: Primary Parent Email
- **Column 3 (Optional)**: Secondary Parent Email

### Important Notes:
- The first row MUST be the header row (Name,Parent Email,2nd Parent Email)
- Student Name is required, emails are optional
- If a parent email is not available, leave it blank but keep the comma
- No quotation marks needed around names or emails
- Save the file as `.csv` format

## Sample Data File

A sample CSV file with 30 students has been created at:
**`sample-class-data.csv`**

This file includes:
- 30 sample students
- Realistic parent email addresses
- One student (Ethan Martinez) with the email: `jermiah.jerome@conversyai.com`

## Example CSV Content

```csv
Name,Parent Email,2nd Parent Email
Emma Johnson,emma.parent@email.com,emma.parent2@email.com
Liam Smith,liam.parent@email.com,
Olivia Brown,olivia.parent@email.com,olivia.parent2@email.com
```

## Features

- ✅ Batch upload multiple students at once
- ✅ Automatic database persistence
- ✅ Support for dual parent emails
- ✅ Instant feedback on successful upload
- ✅ Error handling for invalid files

## Troubleshooting

- **"No valid students found in CSV"**: Make sure your CSV has at least one student with a name
- **"Please upload a CSV file"**: File must have `.csv` extension
- **"Please enter a class name"**: Class name is required before uploading

