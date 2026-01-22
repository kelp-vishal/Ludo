import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

function passwordMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup(
    {
      username: new FormControl('', {
        validators: [Validators.required, Validators.minLength(3)],
      }),
      email: new FormControl('', {
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  get usernameInvalid() {
    return (
      this.form.controls.username.touched && this.form.controls.username.invalid
    );
  }

  get emailInvalid() {
    return this.form.controls.email.touched && this.form.controls.email.invalid;
  }

  get passwordInvalid() {
    return (
      this.form.controls.password.touched && this.form.controls.password.invalid
    );
  }

  get confirmPasswordInvalid() {
    return (
      this.form.controls.confirmPassword.touched &&
      this.form.controls.confirmPassword.invalid
    );
  }

  get passwordMismatch() {
    return (
      this.form.hasError('passwordMismatch') &&
      this.form.controls.confirmPassword.touched
    );
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const username = this.form.value.username!;
    const email = this.form.value.email!;
    const password = this.form.value.password!;

    this.authService.register(username, email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage =
          'Account created successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  onReset() {
    this.form.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }
}
