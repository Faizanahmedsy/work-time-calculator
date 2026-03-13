export const MewurkService = {
  fetchCardDetails: async (token, employeeCode, year, month) => {
    const response = await fetch("https://app.mewurk.com/api/v1/attendanceservice/attendance/carddetails", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        employeeCode: Number(employeeCode),
        year: year,
        month: month
      })
    });

    if (!response.ok) {
      return {
        isSuccess: false,
        statusCode: response.status,
        message: `API Error: ${response.status}`,
        data: null,
        paginationResponse: null
      };
    }
    return response.json();
  },

  fetchAttendanceLogs: async (date, token, employeeCode) => {
    const response = await fetch("https://app.mewurk.com/api/v1/attendanceservice/attendancelogs/clockindetails", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "authorization": `Bearer ${token}`,
        "content-type": "application/json",
        "priority": "u=1, i"
      },
      body: JSON.stringify({
        employeeCode: Number(employeeCode),
        clockDate: date 
      })
    });

    if (!response.ok) {
      return {
        isSuccess: false,
        statusCode: response.status,
        message: `API Error: ${response.status}`,
        data: null,
        paginationResponse: null
      };
    }

    return response.json();
  },

  lookupUser: async (email) => {
    const response = await fetch(`https://app.mewurk.com/api/v1/userservice/account/lookup?userName=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'content-type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`Lookup Failed: ${response.status}`);
    return response.json();
  },

  loginUser: async (email, password, tenantId) => {
    const rawUserName = `${email}|${tenantId}`;
    const encodedUserName = btoa(rawUserName);

    const response = await fetch('https://app.mewurk.com/api/v1/userservice/account/login', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        userName: encodedUserName,
        password: password,
        otp: null
      })
    });
    if (!response.ok) throw new Error(`Login Failed: ${response.status}`);
    return response.json();
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await fetch(
        "https://app.mewurk.com/api/v1/userservice/account/refreshtoken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Refresh token error:", error);
      return {
        isSuccess: false,
        statusCode: 500,
        message: "Network error during token refresh",
        data: {},
      };
    }
  }
};
