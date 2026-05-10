// Wait for DOM to load before running
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin dashboard initializing...');
    
    // Check authentication
    if (typeof requireAuth === 'undefined') {
        console.error('❌ requireAuth function not loaded! Check auth.js');
        return;
    }
    
    if (!requireAuth()) {
        return; // redirecting...
    }

    // Get current user
    const user = getCurrentUser();
    if (!user) {
        console.error('❌ No user found');
        return;
    }
    
    console.log('👤 Current user:', user);
    
    // Check if admin
    if (user.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = '../student/dashboard.html';
        return;
    }

    // Set user info
    document.getElementById('adminName').textContent = user.name;
    document.getElementById('adminEmail').textContent = user.email;
    document.getElementById('adminInitial').textContent = user.name.charAt(0).toUpperCase();
    
    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);

    // Set minimum date for due date (today)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dueDate').min = today;
    // Set default due date to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    document.getElementById('dueDate').value = defaultDueDate.toISOString().split('T')[0];

    // Store all students for filtering
    let allStudents = [];

    // Load dashboard stats
    async function loadStats() {
        try {
            console.log('📊 Loading stats...');
            
            // Load students count
            const studentsData = await apiCall('/admin/students');
            allStudents = studentsData.students || [];
            document.getElementById('totalStudents').textContent = allStudents.length;

            // Load fees data
            const feesData = await apiCall('/admin/fees');
            const pendingFees = feesData.fees?.filter(f => f.status === 'PENDING') || [];
            document.getElementById('pendingFees').textContent = pendingFees.length;

            // Load report data
            const reportData = await apiCall('/admin/reports');
            
            if (reportData?.report) {
                document.getElementById('totalCollections').textContent = `₹${reportData.report.totalAmount.toLocaleString()}`;
                
                const thisMonth = new Date().getMonth();
                const monthlyTotal = reportData.report.payments
                    .filter(p => new Date(p.createdAt).getMonth() === thisMonth)
                    .reduce((sum, p) => sum + p.amount, 0);
                document.getElementById('monthlyTotal').textContent = `₹${monthlyTotal.toLocaleString()}`;
            }

            // Load students for selection
            displayStudents(allStudents);

        } catch (error) {
            console.error('❌ Error loading stats:', error);
        }
    }

    // Load students for selection
    async function loadStudents() {
        try {
            console.log('👥 Loading students...');
            
            const data = await apiCall('/admin/students');
            console.log('✅ Students data:', data);
            
            const container = document.getElementById('studentsContainer');
            
            if (!data.students || data.students.length === 0) {
                container.innerHTML = '<p class="text-center" style="padding: 20px;">No students found. Please register students first.</p>';
                return;
            }
            
            displayStudents(data.students);
            
        } catch (error) {
            console.error('❌ Error loading students:', error);
            document.getElementById('studentsContainer').innerHTML = 
                '<p class="text-center" style="color: #e74c3c; padding: 20px;">❌ Failed to load students</p>';
        }
    }

    // Display students list
    function displayStudents(students) {
        const container = document.getElementById('studentsContainer');
        const searchInput = document.getElementById('studentSearch');
        const selectAllCheckbox = document.getElementById('selectAllStudents');
        
        // Update student count
        document.getElementById('studentCount').textContent = `${students.length} total`;

        function filterStudents() {
            const searchTerm = searchInput?.value.toLowerCase() || '';
            const filtered = students.filter(s => 
                s.name.toLowerCase().includes(searchTerm) ||
                s.rollNumber.toLowerCase().includes(searchTerm)
            );

            if (filtered.length === 0) {
                container.innerHTML = '<div class="text-center">No matching students found</div>';
            } else {
                container.innerHTML = filtered.map(s => `
                    <div class="student-item" data-roll="${s.rollNumber}" data-name="${s.name}" data-course="${s.course || 'N/A'}" data-batch="${s.batch || 'N/A'}" onclick="selectStudent('${s.rollNumber}', '${s.name}', '${s.course || 'N/A'}', '${s.batch || 'N/A'}', event)">
                        <strong>${s.name}</strong>
                        <small>${s.rollNumber} · ${s.course || 'N/A'} · ${s.batch || 'N/A'}</small>
                    </div>
                `).join('');
            }
        }

        filterStudents();
        
        if (searchInput) {
            searchInput.addEventListener('input', filterStudents);
        }
        
        // Handle Select All checkbox
        selectAllCheckbox.addEventListener('change', function() {
            const studentItems = document.querySelectorAll('.student-item');
            
            if (this.checked) {
                // Select all students
                studentItems.forEach(item => {
                    item.classList.add('selected');
                });
                
                // Clear any previously selected single student
                document.getElementById('selectedRollNumber').value = '';
                document.getElementById('selectedStudentName').value = '';
                document.getElementById('selectedStudentInfo').style.display = 'none';
                
                // Enable assign button
                document.getElementById('assignBtn').disabled = false;
                
            } else {
                // Deselect all students
                studentItems.forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Also clear single student selection
                document.getElementById('selectedRollNumber').value = '';
                document.getElementById('selectedStudentName').value = '';
                document.getElementById('selectedStudentInfo').style.display = 'none';
                
                // Disable assign button
                document.getElementById('assignBtn').disabled = true;
            }
        });
    }

    // Select student
    window.selectStudent = function(rollNumber, name, course, batch, event) {
        // Uncheck select all when manually selecting
        const selectAllCheckbox = document.getElementById('selectAllStudents');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        document.getElementById('selectedRollNumber').value = rollNumber;
        document.getElementById('selectedStudentName').textContent = name;
        document.getElementById('selectedStudentRoll').textContent = `${rollNumber} · ${course} · ${batch}`;
        document.getElementById('selectedStudentInfo').style.display = 'flex';
        document.getElementById('assignBtn').disabled = false;
        
        // Remove 'selected' class from ALL student items first
        document.querySelectorAll('.student-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add 'selected' class ONLY to the clicked item
        if (event?.currentTarget) {
            event.currentTarget.classList.add('selected');
        } else {
            // Fallback: find and select the item by data-roll
            const items = document.querySelectorAll('.student-item');
            items.forEach(item => {
                if (item.getAttribute('data-roll') === rollNumber) {
                    item.classList.add('selected');
                }
            });
        }
    };

    // Handle form submission
    document.getElementById('feeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectAllChecked = document.getElementById('selectAllStudents').checked;
        const rollNumber = document.getElementById('selectedRollNumber').value;
        
        // If Select All is checked, get all student roll numbers
        if (selectAllChecked) {
            const studentItems = document.querySelectorAll('.student-item.selected');
            const rollNumbers = [];
            studentItems.forEach(item => {
                const roll = item.getAttribute('data-roll');
                if (roll) rollNumbers.push(roll);
            });
            
            if (rollNumbers.length === 0) {
                alert('No students selected');
                return;
            }
            
            // Confirm with admin
            if (!confirm(`Assign this fee to ${rollNumbers.length} students?`)) {
                return;
            }
            
            // Assign fee to each student
            const feeData = {
                feeType: document.getElementById('feeType').value,
                amount: parseFloat(document.getElementById('amount').value),
                dueDate: document.getElementById('dueDate').value,
                description: document.getElementById('description').value || document.getElementById('feeType').value + ' Fee'
            };
            
            let successCount = 0;
            let failCount = 0;
            
            // Show loading
            const assignBtn = document.getElementById('assignBtn');
            const originalText = assignBtn.textContent;
            assignBtn.disabled = true;
            assignBtn.textContent = `Assigning to ${rollNumbers.length} students...`;
            
            // Assign to each student
            for (const roll of rollNumbers) {
                try {
                    await apiCall('/admin/fees/assign', {
                        method: 'POST',
                        body: JSON.stringify({
                            ...feeData,
                            rollNumber: roll
                        })
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed for ${roll}:`, error);
                    failCount++;
                }
            }
            
            // Show result
            const messageDiv = document.getElementById('message');
            messageDiv.className = 'success-message';
            messageDiv.innerHTML = `✅ Assigned to ${successCount} students ${failCount > 0 ? `, ${failCount} failed` : ''}`;
            messageDiv.style.display = 'block';
            
            // Reset
            document.getElementById('selectAllStudents').checked = false;
            document.querySelectorAll('.student-item').forEach(item => {
                item.classList.remove('selected');
            });
            document.getElementById('feeForm').reset();
            document.getElementById('selectedStudentInfo').style.display = 'none';
            
            // Reset due date to default
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 30);
            document.getElementById('dueDate').value = defaultDueDate.toISOString().split('T')[0];
            
            assignBtn.disabled = true;
            assignBtn.textContent = originalText;
            
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
            
            // Reload stats
            loadStats();
            
        } else {
            // Existing single student assignment
            if (!rollNumber) {
                alert('Please select a student first');
                return;
            }

            const feeData = {
                rollNumber,
                feeType: document.getElementById('feeType').value,
                amount: parseFloat(document.getElementById('amount').value),
                dueDate: document.getElementById('dueDate').value,
                description: document.getElementById('description').value || document.getElementById('feeType').value + ' Fee'
            };

            try {
                const data = await apiCall('/admin/fees/assign', {
                    method: 'POST',
                    body: JSON.stringify(feeData)
                });

                const messageDiv = document.getElementById('message');
                messageDiv.className = 'success-message';
                messageDiv.innerHTML = '✅ Fee assigned successfully!';
                messageDiv.style.display = 'block';
                
                document.getElementById('feeForm').reset();
                document.getElementById('selectedRollNumber').value = '';
                document.getElementById('selectedStudentInfo').style.display = 'none';
                document.getElementById('assignBtn').disabled = true;
                
                // Reset due date to default
                const defaultDueDate = new Date();
                defaultDueDate.setDate(defaultDueDate.getDate() + 30);
                document.getElementById('dueDate').value = defaultDueDate.toISOString().split('T')[0];
                
                loadStats();

                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);

            } catch (error) {
                alert('Failed to assign fee: ' + error.message);
            }
        }
    });

    // Load data
    loadStats();
    loadStudents();
});