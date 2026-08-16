plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "world.igra.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "world.igra.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 77
        versionName = "0.4.73"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.activity:activity-ktx:1.9.1")
}

// Keep the Android WebView copy of the game in sync with /web
tasks.register<Copy>("syncWeb") {
    from(rootProject.file("../web"))
    into(layout.projectDirectory.dir("src/main/assets/www"))
    exclude("**/.DS_Store")
}

tasks.named("preBuild") {
    dependsOn("syncWeb")
}
