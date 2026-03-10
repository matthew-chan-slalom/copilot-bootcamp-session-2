# Functional Requirements: Todo App Due Date Functionality

## Overview
This document defines the functional requirements for adding due date support to the todo application.

## Scope
Due date functionality applies to creating, viewing, editing, sorting, and validating todo items.

## Functional Requirements

### FR-1: Set Due Date on Create
The system shall allow a user to assign an optional due date when creating a new todo item.

### FR-2: Default Behavior Without Due Date
The system shall allow creation of todo items without a due date.

### FR-3: Display Due Date
The system shall display the due date for each todo item that has one.

### FR-4: Edit Due Date
The system shall allow a user to add, update, or remove a due date on an existing todo item.

### FR-5: Due Date Validation
The system shall validate that due dates are valid calendar dates.

### FR-6: Consistent Date Format
The system shall store and present due dates in a consistent format across the application.

### FR-7: Overdue Identification
The system shall identify todo items as overdue when the current date is later than the due date and the item is not marked complete.

### FR-8: Completed Items and Overdue State
The system shall not mark completed todo items as overdue, regardless of due date.

### FR-9: Sort by Due Date
The system shall support sorting todo items by due date (earliest first and latest first).

### FR-10: Filter by Due Date Status
The system shall support filtering todo items by due date status, including:
- Due today
- Due this week
- Overdue
- No due date

### FR-11: Persist Due Date Data
The system shall persist due date values so they are retained across page refreshes and application restarts.

### FR-12: Time Zone Handling
The system shall evaluate due date status (for example, overdue and due today) using a defined application time zone rule.

## Non-Functional Considerations (Supporting)

### NFR-1: Usability
Due date input and display shall be easy to understand and require no additional training for standard use.

### NFR-2: Accessibility
Due date fields and indicators shall be accessible via keyboard and readable by assistive technologies.

## Acceptance Criteria Summary
1. Users can create todo items with or without due dates.
2. Users can edit and remove due dates.
3. Due dates are displayed consistently.
4. Invalid dates are rejected with clear feedback.
5. Overdue logic is applied correctly for incomplete items only.
6. Sorting and filtering by due date and due date status work as specified.
7. Due dates remain saved after refresh or restart.
